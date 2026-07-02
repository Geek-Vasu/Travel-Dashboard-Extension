import json
import datetime
from sqlalchemy.orm import Session
from ..models import User, Trip, Booking, TimelineEvent, Insight, PackingItem, ChatMessage
from ..config import settings


def build_travel_context(db: Session, user_id: int) -> str:
    """Build structured text context from user's travel data for RAG."""
    trips = db.query(Trip).filter(Trip.user_id == user_id).all()
    
    if not trips:
        return "No travel data available. The user has not scanned any emails yet."
    
    context_parts = []
    
    for trip in trips:
        bookings = db.query(Booking).filter(Booking.trip_id == trip.id).all()
        timeline = db.query(TimelineEvent).filter(TimelineEvent.trip_id == trip.id).order_by(TimelineEvent.event_time.asc()).all()
        insights = db.query(Insight).filter(Insight.trip_id == trip.id).all()
        packing = db.query(PackingItem).filter(PackingItem.trip_id == trip.id).all()
        
        trip_text = f"""\n=== TRIP: {trip.trip_name} ===
Destination: {trip.destination}
Dates: {trip.start_date} to {trip.end_date}
Status: {trip.status}
Summary: {trip.ai_summary or 'No summary'}
"""
        
        if bookings:
            trip_text += "\nBOOKINGS:\n"
            total_cost = 0
            for b in bookings:
                details = b.details or {}
                trip_text += f"  - {b.booking_type.upper()}: {b.provider} | Cost: {b.currency} {b.cost} | PNR: {b.pnr or 'N/A'}\n"
                if b.booking_type == "flight":
                    trip_text += f"    Flight {details.get('flight_number', 'N/A')}: {details.get('departure_city', '?')} → {details.get('arrival_city', '?')}\n"
                    trip_text += f"    Departure: {details.get('departure_time', 'N/A')} | Arrival: {details.get('arrival_time', 'N/A')}\n"
                elif b.booking_type == "hotel":
                    trip_text += f"    Hotel: {details.get('hotel_name', b.provider)} | Address: {details.get('address', 'N/A')}\n"
                    trip_text += f"    Check-in: {details.get('check_in', 'N/A')} | Check-out: {details.get('check_out', 'N/A')}\n"
                elif b.booking_type == "train":
                    trip_text += f"    Train: {details.get('train_name', 'N/A')} | Seat: {details.get('seat_number', 'N/A')}\n"
                    trip_text += f"    {details.get('departure_station', '?')} → {details.get('arrival_station', '?')}\n"
                elif b.booking_type == "cab":
                    trip_text += f"    {details.get('pickup_location', '?')} → {details.get('dropoff_location', '?')}\n"
                    trip_text += f"    Pickup: {details.get('pickup_time', 'N/A')}\n"
                total_cost += b.cost
            trip_text += f"  TOTAL TRIP COST: INR {total_cost}\n"
        
        if timeline:
            trip_text += "\nTIMELINE:\n"
            for evt in timeline:
                trip_text += f"  - [{evt.event_time.strftime('%b %d, %I:%M %p')}] {evt.title} @ {evt.location or 'N/A'}\n"
        
        if insights:
            trip_text += "\nINSIGHTS & ALERTS:\n"
            for ins in insights:
                trip_text += f"  - [{ins.severity.upper()}] {ins.message}\n"
        
        if packing:
            checked = sum(1 for p in packing if p.is_checked == 1)
            trip_text += f"\nPACKING LIST ({checked}/{len(packing)} packed):\n"
            categories = {}
            for p in packing:
                categories.setdefault(p.category, []).append(
                    f"{'[x]' if p.is_checked == 1 else '[ ]'} {p.item_name}"
                )
            for cat, items in categories.items():
                trip_text += f"  {cat}: {', '.join(items)}\n"
        
        context_parts.append(trip_text)
    
    return "\n".join(context_parts)


def chat_with_assistant(db: Session, user_id: int, message: str) -> dict:
    """Process a chat message and return AI response with sources."""
    
    # Save user message
    user_msg = ChatMessage(
        user_id=user_id,
        role="user",
        content=message
    )
    db.add(user_msg)
    db.commit()
    
    # Build context
    context = build_travel_context(db, user_id)
    
    # Get recent conversation history (last 10 messages)
    history = db.query(ChatMessage).filter(
        ChatMessage.user_id == user_id
    ).order_by(ChatMessage.created_at.desc()).limit(10).all()
    history.reverse()
    
    system_prompt = f"""You are Travelista AI, a personal travel assistant. You ONLY answer questions about the user's travel data provided below. Never fabricate information.

If the user asks about something not in the data, say: "I don't have that information in your travel records."

Always cite the source of your information (trip name, booking provider, flight number, etc.).
Keep responses concise, friendly, and travel-focused.
Format important details in bold using **text**.
Use bullet points for lists.
At the end of your response, suggest 2-3 relevant follow-up questions the user might ask.
Format suggestions as: **Suggested:** question1 | question2 | question3

USER'S TRAVEL DATA:
{context}"""
    
    if not settings.openai_api_key or not settings.openai_api_key.strip():
        # Fallback: simple keyword-based response
        assistant_content = _fallback_response(context, message)
        sources = []
    else:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=settings.openai_api_key)
            
            messages = [{"role": "system", "content": system_prompt}]
            for msg in history[:-1]:  # Exclude the just-saved user message since we add it below
                messages.append({"role": msg.role, "content": msg.content})
            messages.append({"role": "user", "content": message})
            
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                temperature=0.5,
                max_tokens=500
            )
            assistant_content = response.choices[0].message.content.strip()
            sources = _extract_sources(db, user_id, assistant_content)
        except Exception as e:
            print(f"Chat AI error: {e}")
            assistant_content = f"I encountered an error processing your request. Please try again."
            sources = []
    
    # Save assistant response
    assistant_msg = ChatMessage(
        user_id=user_id,
        role="assistant",
        content=assistant_content,
        sources=sources
    )
    db.add(assistant_msg)
    db.commit()
    
    # Extract suggested questions from response
    suggested = []
    if "**Suggested:**" in assistant_content:
        parts = assistant_content.split("**Suggested:**")
        if len(parts) > 1:
            suggested = [q.strip() for q in parts[1].strip().split("|") if q.strip()]
    
    return {
        "response": assistant_content,
        "sources": sources,
        "suggested_questions": suggested
    }


def _extract_sources(db: Session, user_id: int, response_text: str) -> list:
    """Extract referenced trips/bookings from the AI response."""
    sources = []
    trips = db.query(Trip).filter(Trip.user_id == user_id).all()
    for trip in trips:
        if trip.trip_name.lower() in response_text.lower() or trip.destination.lower() in response_text.lower():
            sources.append({"type": "trip", "id": trip.id, "label": trip.trip_name})
            break  # Keep sources concise
    return sources


def _fallback_response(context: str, message: str) -> str:
    """Simple keyword-based response when OpenAI is unavailable."""
    msg_lower = message.lower()
    if "flight" in msg_lower or "when" in msg_lower:
        return "Please check your trip timeline for flight details. I need the OpenAI API to provide detailed answers.\n\n**Suggested:** Show my trips | What is my hotel address? | How much have I spent?"
    elif "hotel" in msg_lower or "stay" in msg_lower:
        return "Please check your trip bookings for hotel details. I need the OpenAI API to provide detailed answers.\n\n**Suggested:** When is my flight? | Show my trips | What should I pack?"
    elif "spend" in msg_lower or "cost" in msg_lower or "much" in msg_lower:
        return "Please check the spend analytics on your dashboard for cost breakdowns. I need the OpenAI API to provide detailed answers.\n\n**Suggested:** When is my flight? | Where am I staying? | Show my trips"
    else:
        return "I need the OpenAI API to answer your travel questions in detail. Please ensure your API key is configured.\n\n**Suggested:** When is my flight? | Where am I staying? | How much have I spent?"


def get_chat_history(db: Session, user_id: int, limit: int = 50) -> list:
    """Get conversation history for the user."""
    messages = db.query(ChatMessage).filter(
        ChatMessage.user_id == user_id
    ).order_by(ChatMessage.created_at.asc()).limit(limit).all()
    
    return [{
        "id": m.id,
        "role": m.role,
        "content": m.content,
        "sources": m.sources,
        "created_at": m.created_at.isoformat()
    } for m in messages]


def clear_chat_history(db: Session, user_id: int) -> bool:
    """Clear all chat messages for the user."""
    db.query(ChatMessage).filter(ChatMessage.user_id == user_id).delete(synchronize_session=False)
    db.commit()
    return True
