import datetime
from sqlalchemy.orm import Session
from ..models import Booking, Insight, Trip
from ..config import settings

def parse_iso_datetime(dt_str) -> datetime.datetime:
    if not dt_str:
        return datetime.datetime.utcnow()
    if isinstance(dt_str, datetime.datetime):
        return dt_str
    try:
        return datetime.datetime.fromisoformat(dt_str)
    except Exception:
        return datetime.datetime.utcnow()

def generate_hybrid_insights(db: Session, trip: Trip) -> list[Insight]:
    """
    Analyzes a trip's bookings and populates the insights table with:
    1. Smart rule-based travel warnings, alerts, and instructions.
    2. A GPT-generated (or template-fallback) summary stored in Trip.ai_summary.
    """
    # 1. Clear old insights
    db.query(Insight).filter(Insight.trip_id == trip.id).delete()
    
    bookings = db.query(Booking).filter(Booking.trip_id == trip.id).all()
    insights = []
    
    # Track categories for rules
    has_hotel = False
    has_flight = False
    has_train = False
    has_cab = False
    
    outbound_dest = None
    return_dest = None
    
    hotel_checkout_dt = None
    return_flight_dep_dt = None
    
    current_date = datetime.date(2026, 6, 15) # System current date
    
    for booking in bookings:
        details = booking.details or {}
        b_type = booking.booking_type
        cost = booking.cost
        
        # Rule: Flight payment check
        if cost == 0:
            insights.append(Insight(
                trip_id=trip.id,
                message=f"Payment status for {booking.provider} {b_type} booking seems pending (Cost listed is 0).",
                severity="caution",
                insight_type="rule_based"
            ))
            
        if b_type == "hotel":
            has_hotel = True
            hotel_name = details.get("hotel_name") or booking.provider
            
            # Default Hotel ID check rules
            insights.append(Insight(
                trip_id=trip.id,
                message=f"Remember to carry your physical government ID for verification at check-in for {hotel_name}.",
                severity="info",
                insight_type="rule_based"
            ))
            
            # Check-in time tip
            insights.append(Insight(
                trip_id=trip.id,
                message=f"Hotel check-in at {hotel_name} begins at 2:00 PM. Check-out is by 12:00 PM.",
                severity="info",
                insight_type="rule_based"
            ))
            
            check_out_str = details.get("check_out")
            if check_out_str:
                hotel_checkout_dt = parse_iso_datetime(check_out_str)
                
        elif b_type == "flight":
            has_flight = True
            dep_city = details.get("departure_city") or ""
            arr_city = details.get("arrival_city") or ""
            dep_time_str = details.get("departure_time")
            
            # Web check-in rule
            if dep_time_str:
                dep_dt = parse_iso_datetime(dep_time_str)
                time_diff = dep_dt.date() - current_date
                if time_diff.days == 1:
                    insights.append(Insight(
                        trip_id=trip.id,
                        message=f"Web check-in for your flight {details.get('flight_number', '')} to {arr_city} opens today!",
                        severity="warning",
                        insight_type="rule_based"
                    ))
                elif time_diff.days > 1:
                    insights.append(Insight(
                        trip_id=trip.id,
                        message=f"Web check-in for flight {details.get('flight_number', '')} opens 24 hours before departure on {dep_dt.strftime('%d %b')}.",
                        severity="info",
                        insight_type="rule_based"
                    ))
            
            # Check for route directions
            if not outbound_dest:
                outbound_dest = arr_city
            else:
                return_dest = arr_city
                
            if dep_time_str and arr_city.lower() != trip.destination.lower():
                # This is likely a return flight
                return_flight_dep_dt = parse_iso_datetime(dep_time_str)
                
        elif b_type == "train":
            has_train = True
            dep_station = details.get("departure_station") or ""
            arr_station = details.get("arrival_station") or ""
            
            if not outbound_dest:
                outbound_dest = arr_station
            else:
                return_dest = arr_station
                
        elif b_type == "cab":
            has_cab = True

    # Rule: Missing return booking
    # If we have flights or trains going to destination, but haven't found a return ticket
    if (has_flight or has_train) and not return_dest and trip.status != "Completed":
        insights.append(Insight(
            trip_id=trip.id,
            message="No return flight or train booking detected back to your home location. Please verify.",
            severity="caution",
            insight_type="rule_based"
        ))
        
    # Rule: Hotel checkout vs Return flight conflict
    if hotel_checkout_dt and return_flight_dep_dt:
        if hotel_checkout_dt > return_flight_dep_dt:
            insights.append(Insight(
                trip_id=trip.id,
                message="Your hotel checkout is scheduled after your return flight departure time. Double check dates!",
                severity="caution",
                insight_type="rule_based"
            ))
        elif (return_flight_dep_dt - hotel_checkout_dt).total_seconds() > 36000: # Over 10 hours gap
            insights.append(Insight(
                trip_id=trip.id,
                message="There is a gap of over 10 hours between hotel check-out and your return flight. Consider requesting late checkout.",
                severity="info",
                insight_type="rule_based"
            ))

    for ins in insights:
        db.add(ins)

    # 2. AI Trip Summary Generation
    ai_summary = ""
    trip_duration_days = (trip.end_date - trip.start_date).days + 1
    
    if settings.openai_api_key and settings.openai_api_key.strip() != "":
        try:
            from openai import OpenAI
            client = OpenAI(api_key=settings.openai_api_key)
            
            bookings_desc = []
            for b in bookings:
                bookings_desc.append(f"{b.booking_type.capitalize()} with {b.provider} ({b.pnr or 'no reference'})")
                
            prompt = f"""
You are a travel summary generator. Generate a concise, one-sentence overview summary of a trip.
Trip Destination: {trip.destination}
Duration: {trip_duration_days} days
Status: {trip.status}
Bookings: {', '.join(bookings_desc)}

Provide only the summary string, under 25 words. Do not use quotes or markdown.
Example format: "A 3-day business trip to Mumbai featuring IndiGo flights, a stay at Taj Lands End, and local cab rides."
"""
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=50,
                temperature=0.7
            )
            ai_summary = response.choices[0].message.content.strip()
        except Exception as e:
            print(f"OpenAI trip summary failed, using template fallback: {e}")
            ai_summary = ""
            
    if not ai_summary:
        # Template-based fallback
        booking_summary_parts = []
        if has_flight: booking_summary_parts.append("flights")
        if has_train: booking_summary_parts.append("train travel")
        if has_hotel: booking_summary_parts.append("hotel lodging")
        if has_cab: booking_summary_parts.append("local cabs")
        
        booking_str = " and ".join(booking_summary_parts) if booking_summary_parts else "travel items"
        
        type_str = "business trip" if trip.destination.lower() == "mumbai" else ("family visit" if trip.destination.lower() == "delhi" else "vacation")
        
        ai_summary = f"A {trip_duration_days}-day {type_str} to {trip.destination} featuring {booking_str}."

    trip.ai_summary = ai_summary
    db.add(trip)
    
    db.flush()
    return insights
