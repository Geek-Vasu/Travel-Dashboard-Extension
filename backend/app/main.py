import os
# Set environment variables before importing any oauthlib-related modules
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
os.environ['OAUTHLIB_RELAX_TOKEN_SCOPE'] = '1'

import time
import datetime
import json
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, status
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from .database import engine, Base, get_db
from .models import User, EmailProcessing, Trip, Booking, TimelineEvent, Insight, PackingItem, ChatMessage
from .schemas import (
    TripResponse, DetailedTripResponse, EmailProcessingResponse,
    DashboardData, DashboardStats, CategorySpend, MonthlySpend,
    BookingResponse, ValidationRecordResponse
)
from .config import settings
from .services.email_provider import get_email_provider
from .services.email_cleaner import clean_email_body
from .services.extractor import get_booking_extractor
from .services.grouping import add_booking_to_trip
from .services.timeline import generate_trip_timeline
from .services.insights import generate_hybrid_insights
from .services.calendar_service import sync_trip_to_calendar, remove_trip_from_calendar, get_calendar_sync_status
from .services.packing_service import generate_packing_list, get_packing_list, update_packing_item, delete_packing_item, add_custom_item
from .services.chat_service import chat_with_assistant, get_chat_history, clear_chat_history


# Initialize Database tables
Base.metadata.create_all(bind=engine)

# Phase 2 migrations to add calendar columns to trips table if they do not exist
try:
    from sqlalchemy import inspect, text
    inspector = inspect(engine)
    columns = [col['name'] for col in inspector.get_columns('trips')]
    with engine.connect() as conn:
        if 'calendar_sync_enabled' not in columns:
            conn.execute(text('ALTER TABLE trips ADD COLUMN calendar_sync_enabled VARCHAR'))
            conn.commit()
        if 'calendar_event_ids' not in columns:
            conn.execute(text('ALTER TABLE trips ADD COLUMN calendar_event_ids JSON'))
            conn.commit()
        if 'last_calendar_sync' not in columns:
            conn.execute(text('ALTER TABLE trips ADD COLUMN last_calendar_sync TIMESTAMP'))
            conn.commit()
except Exception as e:
    print(f"Migration error/info: {e}")


app = FastAPI(title="Travel Dashboard Organizer API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local development, allow any origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper to ensure we have a default user
def get_default_user_id(db: Session) -> int:
    # 1. Try to load active user from token.json
    token_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "token.json")
    if os.path.exists(token_path):
        try:
            with open(token_path, "r") as f:
                info = json.load(f)
            email = info.get("user_email")
            name = info.get("user_name")
            if email:
                user = db.query(User).filter(User.email == email).first()
                if not user:
                    user = User(email=email, name=name)
                    db.add(user)
                    db.commit()
                    db.refresh(user)
                return user.id
        except Exception as e:
            print(f"Error resolving default user from token.json: {e}")

    # Fallback to local dev mock email
    default_email = "vasu.dev@gmail.com"
    user = db.query(User).filter(User.email == default_email).first()
    if not user:
        user = User(email=default_email, name="Vasu Dev")
        db.add(user)
        db.commit()
        db.refresh(user)
    return user.id

# Global variable to simulate scan progress in background
scan_progress = {"is_scanning": False, "processed": 0, "total": 0, "error": None}

def background_scan_task(user_id: int, db_url: str):
    """
    Background worker that runs email scanning.
    Uses its own db session because it runs in a background thread.
    """
    global scan_progress
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    
    # Establish connection inside background thread
    bg_engine = create_engine(db_url, connect_args={"check_same_thread": False} if db_url.startswith("sqlite") else {})
    BgSession = sessionmaker(bind=bg_engine)
    db = BgSession()
    
    try:
        scan_progress["is_scanning"] = True
        scan_progress["error"] = None
        
        # Clear old process runs and trips to allow fresh scans in simulation
        db.query(EmailProcessing).filter(EmailProcessing.user_id == user_id).delete(synchronize_session=False)
        
        # Query trip IDs to safely delete child records in PostgreSQL due to FK constraints
        trip_ids = [t[0] for t in db.query(Trip.id).filter(Trip.user_id == user_id).all()]
        if trip_ids:
            db.query(Insight).filter(Insight.trip_id.in_(trip_ids)).delete(synchronize_session=False)
            db.query(TimelineEvent).filter(TimelineEvent.trip_id.in_(trip_ids)).delete(synchronize_session=False)
            db.query(Booking).filter(Booking.trip_id.in_(trip_ids)).delete(synchronize_session=False)
            db.query(PackingItem).filter(PackingItem.trip_id.in_(trip_ids)).delete(synchronize_session=False)
            
        db.query(Trip).filter(Trip.user_id == user_id).delete(synchronize_session=False)
        db.commit()
        
        provider = get_email_provider() # Defaults to MockEmailProvider if no token
        extractor = get_booking_extractor()
        
        messages = provider.fetch_messages()
        scan_progress["total"] = len(messages)
        scan_progress["processed"] = 0
        
        # Initialize processing records
        for msg in messages:
            record = EmailProcessing(
                user_id=user_id,
                email_id=msg["id"],
                subject=msg["subject"],
                sender=msg.get("sender"),
                status="pending"
            )
            db.add(record)
        db.commit()
        
        # Process each message
        for idx, msg in enumerate(messages):
            record = db.query(EmailProcessing).filter(
                EmailProcessing.user_id == user_id,
                EmailProcessing.email_id == msg["id"]
            ).first()
            
            if not record:
                continue
                
            record.status = "processing"
            db.commit()
            
            # Simulate a brief delay for UI progression effect
            time.sleep(0.04) 
            
            try:
                detail = provider.get_message_detail(msg["id"])
                if not detail:
                    raise Exception("Could not fetch message body")
                    
                body = detail.get("body", "")
                cleaned_body = clean_email_body(body)
                
                # Update audit fields
                record.raw_body = body
                record.cleaned_body = cleaned_body
                db.commit()
                
                # 1. Classification
                is_travel = extractor.classify_email(msg["subject"], msg["snippet"], cleaned_body)
                record.is_travel = is_travel
                db.commit()
                
                if is_travel:
                    # 2. Extract structured booking
                    extracted_data, confidence = extractor.extract_details(msg["subject"], cleaned_body)
                    
                    # Inject confidence directly to extracted data JSON
                    extracted_data["confidence"] = confidence
                    
                    # Attach source traceability info
                    extracted_data["source_email_id"] = msg["id"]
                    extracted_data["source_subject"] = msg["subject"]
                    extracted_data["source_sender"] = msg.get("sender", "Unknown")
                    extracted_data["source_snippet"] = msg["snippet"]
                    extracted_data["source_gmail_link"] = f"https://mail.google.com/mail/u/0/#inbox/{msg['id']}"
                    extracted_data["confidence_score"] = confidence
                    
                    # Update audit fields
                    record.confidence_score = confidence
                    record.extracted_json = extracted_data
                    record.openai_response = json.dumps(extracted_data)
                    db.commit()
                    
                    # 3. Add booking to trip (runs deduplication + groups trips backend-side)
                    db_booking = add_booking_to_trip(db, user_id, extracted_data)
                    db.commit()
                    
                    # Update audit references
                    record.booking_id = db_booking.id
                    record.trip_id = db_booking.trip_id
                    db.commit()
                    
                    # 4. Generate/Update Timeline and Hybrid Insights
                    generate_trip_timeline(db, db_booking.trip_id)
                    generate_hybrid_insights(db, db_booking.trip)
                    db.commit()
                    
                record.status = "completed"
                record.processed_at = datetime.datetime.utcnow()
                db.commit()
                
            except Exception as e:
                db.rollback()
                record.status = "failed"
                record.error_message = str(e)
                db.commit()
                print(f"Failed processing message {msg['id']}: {e}")
                
            scan_progress["processed"] = idx + 1
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        scan_progress["error"] = str(e)
    finally:
        scan_progress["is_scanning"] = False
        db.close()

# ----------------- ENDPOINTS -----------------

@app.get("/api/auth/google/url")
def get_google_auth_url():
    """Returns the Google Sign-in URL or a mock indicator if keys are missing."""
    if not settings.google_client_id or not settings.google_client_secret:
        return {"status": "mock_mode_only", "message": "No Google Credentials found in environment. Please use Mock/Demo mode."}
    
    redirect_uri = settings.google_redirect_uri
    client_id = settings.google_client_id
    scopes_list = [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/calendar.events",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
        "openid"
    ]
    scopes = " ".join(scopes_list)
    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id={client_id}&redirect_uri={redirect_uri}&scope={scopes}&access_type=offline&prompt=consent"
    return {"status": "oauth_available", "url": auth_url}

@app.get("/api/auth/google/callback")
def google_auth_callback(code: str, db: Session = Depends(get_db)):
    """Handles Google redirect callback, authenticates, and redirects user."""
    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(status_code=400, detail="Google OAuth configuration missing.")
        
    try:
        from google_auth_oauthlib.flow import Flow
        from googleapiclient.discovery import build
        
        # 1. Exchange authorization code for access/refresh tokens
        client_config = {
            "web": {
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [settings.google_redirect_uri]
            }
        }
        
        flow = Flow.from_client_config(
            client_config,
            scopes=[
                "https://www.googleapis.com/auth/gmail.readonly",
                "https://www.googleapis.com/auth/userinfo.email",
                "https://www.googleapis.com/auth/userinfo.profile",
                "openid",
                "https://www.googleapis.com/auth/calendar.events"
            ]
        )
        flow.redirect_uri = settings.google_redirect_uri
        flow.fetch_token(code=code)
        credentials = flow.credentials
        
        # 2. Retrieve user info (email and name) using Google API
        service = build('oauth2', 'v2', credentials=credentials)
        user_info = service.userinfo().get().execute()
        email = user_info.get("email")
        name = user_info.get("name")
        
        if not email:
            raise Exception("Failed to retrieve user email from Google Userinfo API.")
            
        # 3. Create or login the User in database
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(email=email, name=name)
            db.add(user)
            db.commit()
            db.refresh(user)
            
        # 4. Serialize credentials + metadata to backend/token.json
        token_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "token.json")
        creds_dict = json.loads(credentials.to_json())
        creds_dict["user_email"] = email
        creds_dict["user_name"] = name
        
        with open(token_path, "w") as f:
            json.dump(creds_dict, f, indent=2)
            
        # 5. Redirect the user back to the frontend scan page
        return RedirectResponse(url="http://localhost:5173/scan")
        
    except Exception as e:
        print(f"OAuth Callback Failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication Callback Failed: {str(e)}"
        )

@app.get("/api/user/me")
def get_current_user(db: Session = Depends(get_db)):
    """Returns the details of the currently signed-in user."""
    user_id = get_default_user_id(db)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "name": user.name or "Vasu Dev",
        "email": user.email
    }

@app.get("/api/scanner/status")
def get_scanner_status(db: Session = Depends(get_db)):
    """Returns the active scanner progress metrics and recent logs."""
    user_id = get_default_user_id(db)
    
    logs = db.query(EmailProcessing).filter(
        EmailProcessing.user_id == user_id
    ).order_by(EmailProcessing.received_at.desc()).limit(150).all()
    
    # Serialize logs
    serialized_logs = []
    for log in logs:
        serialized_logs.append({
            "id": log.id,
            "email_id": log.email_id,
            "subject": log.subject,
            "status": log.status,
            "error_message": log.error_message,
            "processed_at": log.processed_at
        })
        
    return {
        "is_scanning": scan_progress["is_scanning"],
        "processed": scan_progress["processed"],
        "total": scan_progress["total"],
        "error": scan_progress.get("error"),
        "logs": serialized_logs
    }

@app.get("/api/scanner/validation", response_model=List[ValidationRecordResponse])
def get_scanner_validation(db: Session = Depends(get_db)):
    """Returns detailed audit logs for validation of all email extraction processes."""
    user_id = get_default_user_id(db)
    records = db.query(EmailProcessing).filter(
        EmailProcessing.user_id == user_id
    ).order_by(EmailProcessing.received_at.desc()).all()
    return records


@app.post("/api/scanner/scan")
def trigger_email_scan(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Triggers background scanner task."""
    if scan_progress["is_scanning"]:
        return {"status": "already_scanning", "message": "Scanner is currently running."}
        
    user_id = get_default_user_id(db)
    db_url = settings.database_url or "sqlite:///./travel_dashboard.db"
    
    # Reset progress counters
    scan_progress["is_scanning"] = True
    scan_progress["processed"] = 0
    scan_progress["total"] = 0
    
    background_tasks.add_task(background_scan_task, user_id, db_url)
    return {"status": "started", "message": "Scanning started in background."}

@app.get("/api/trips", response_model=List[TripResponse])
def get_user_trips(db: Session = Depends(get_db)):
    """Lists all grouped trips for the user."""
    user_id = get_default_user_id(db)
    trips = db.query(Trip).filter(Trip.user_id == user_id).order_by(Trip.start_date.asc()).all()
    
    response = []
    for trip in trips:
        bookings_count = db.query(Booking).filter(Booking.trip_id == trip.id).count()
        # Create schema mapping
        response.append(TripResponse(
            id=trip.id,
            user_id=trip.user_id,
            trip_name=trip.trip_name,
            destination=trip.destination,
            start_date=trip.start_date,
            end_date=trip.end_date,
            status=trip.status,
            ai_summary=trip.ai_summary,
            bookings_count=bookings_count
        ))
    return response

@app.get("/api/trips/{trip_id}", response_model=DetailedTripResponse)
def get_trip_details(trip_id: int, db: Session = Depends(get_db)):
    """Gets all details for a single trip including bookings, timeline, and insights."""
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
        
    bookings = db.query(Booking).filter(Booking.trip_id == trip_id).all()
    timeline_events = db.query(TimelineEvent).filter(TimelineEvent.trip_id == trip_id).order_by(TimelineEvent.event_time.asc()).all()
    insights = db.query(Insight).filter(Insight.trip_id == trip_id).all()
    
    # Calculate booking counts
    bookings_count = len(bookings)
    
    # Map to pydantic
    return DetailedTripResponse(
        id=trip.id,
        user_id=trip.user_id,
        trip_name=trip.trip_name,
        destination=trip.destination,
        start_date=trip.start_date,
        end_date=trip.end_date,
        status=trip.status,
        ai_summary=trip.ai_summary,
        bookings_count=bookings_count,
        bookings=bookings,
        timeline_events=timeline_events,
        insights=insights
    )

@app.patch("/api/trips/{trip_id}/bookings/{booking_id}", response_model=BookingResponse)
def update_booking_details(trip_id: int, booking_id: int, update_data: Dict[str, Any], db: Session = Depends(get_db)):
    """Allows manual editing/resolving of booking details (especially low-confidence ones)."""
    booking = db.query(Booking).filter(Booking.id == booking_id, Booking.trip_id == trip_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found in this trip")
        
    # Update allowed fields
    if "provider" in update_data:
        booking.provider = update_data["provider"]
    if "cost" in update_data:
        try:
            booking.cost = float(update_data["cost"])
        except ValueError:
            pass
    if "pnr" in update_data:
        booking.pnr = update_data["pnr"]
    if "details" in update_data:
        current_details = booking.details or {}
        current_details.update(update_data["details"])
        booking.details = current_details
        
    # Manually editing implies user verified it, so raise confidence
    booking.confidence_score = 1.0
    
    db.commit()
    db.refresh(booking)
    
    # Re-generate timeline and insights since booking data changed
    generate_trip_timeline(db, trip_id)
    generate_hybrid_insights(db, booking.trip)
    db.commit()
    
    return booking

@app.get("/api/analytics/dashboard", response_model=DashboardData)
def get_dashboard_data(db: Session = Depends(get_db)):
    """Returns statistics, lists, and charts for the user dashboard."""
    user_id = get_default_user_id(db)
    
    trips = db.query(Trip).filter(Trip.user_id == user_id).order_by(Trip.start_date.asc()).all()
    bookings = db.query(Booking).join(Trip).filter(Trip.user_id == user_id).all()
    
    # Calcs
    total_trips = len(trips)
    upcoming_trips = sum(1 for t in trips if t.status == "Upcoming")
    total_spend = sum(b.cost for b in bookings)
    bookings_found = len(bookings)
    
    # Find next upcoming trip (closest start date in future)
    upcoming_trip_details = None
    current_date = datetime.date(2026, 6, 15)
    
    upcoming_trips_sorted = sorted(
        [t for t in trips if t.start_date >= current_date],
        key=lambda x: x.start_date
    )
    
    if upcoming_trips_sorted:
        next_trip = upcoming_trips_sorted[0]
        # Query detailed
        upcoming_trip_details = get_trip_details(next_trip.id, db)
        
    # Simple list responses
    trip_list = []
    for trip in trips:
        bookings_count = db.query(Booking).filter(Booking.trip_id == trip.id).count()
        trip_list.append(TripResponse(
            id=trip.id,
            user_id=trip.user_id,
            trip_name=trip.trip_name,
            destination=trip.destination,
            start_date=trip.start_date,
            end_date=trip.end_date,
            status=trip.status,
            ai_summary=trip.ai_summary,
            bookings_count=bookings_count
        ))
        
    stats = DashboardStats(
        total_trips=total_trips,
        upcoming_trips=upcoming_trips,
        total_spend=total_spend,
        bookings_found=bookings_found
    )
    
    return DashboardData(
        stats=stats,
        upcoming_trip=upcoming_trip_details,
        trips=trip_list
    )

@app.get("/api/analytics/spend")
def get_spend_analytics(db: Session = Depends(get_db)):
    """Returns Recharts structured categories and monthly spend datasets."""
    user_id = get_default_user_id(db)
    bookings = db.query(Booking).join(Trip).filter(Trip.user_id == user_id).all()
    
    # Category spend breakdown
    cats = {"flight": 0.0, "hotel": 0.0, "cab": 0.0, "train": 0.0}
    for b in bookings:
        b_type = b.booking_type.lower()
        if b_type in cats:
            cats[b_type] += b.cost
            
    category_data = [
        CategorySpend(category="Flights", spend=cats["flight"]),
        CategorySpend(category="Hotels", spend=cats["hotel"]),
        CategorySpend(category="Cabs", spend=cats["cab"]),
        CategorySpend(category="Trains", spend=cats["train"])
    ]
    
    # Monthly spend breakdown
    # Group by month string (e.g. "Jan", "Feb", "Jun", "Jul")
    months_map = {
        1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun", 
        7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec"
    }
    
    monthly_costs = {m: 0.0 for m in months_map.values()}
    
    for b in bookings:
        # Get date from booking
        details = b.details or {}
        b_type = b.booking_type
        
        # Pull date
        date_val = None
        if b_type == "flight":
            date_val = details.get("departure_time")
        elif b_type == "hotel":
            date_val = details.get("check_in")
        elif b_type == "train":
            date_val = details.get("departure_time")
        elif b_type == "cab":
            date_val = details.get("pickup_time")
            
        if date_val:
            try:
                dt = datetime.datetime.fromisoformat(date_val)
                month_name = months_map.get(dt.month)
                if month_name:
                    monthly_costs[month_name] += b.cost
            except Exception:
                pass
                
    # Sort monthly list in calendar order
    monthly_data = []
    for m in ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]:
        # Only include if spend > 0 to keep chart tidy or show all
        monthly_data.append(MonthlySpend(month=m, spend=monthly_costs[m]))
        
    return {
        "category_spend": category_data,
        "monthly_spend": [m for m in monthly_data if m.spend > 0] or [MonthlySpend(month="Jun", spend=0.0)]
    }

# --- Calendar Integration ---

@app.post("/api/calendar/sync/{trip_id}")
def sync_calendar(trip_id: int, db: Session = Depends(get_db)):
    """Sync trip timeline events to Google Calendar."""
    result = sync_trip_to_calendar(db, trip_id)
    return result

@app.get("/api/calendar/status/{trip_id}")
def calendar_status(trip_id: int, db: Session = Depends(get_db)):
    """Get calendar sync status for a trip."""
    result = get_calendar_sync_status(db, trip_id)
    return result

@app.delete("/api/calendar/remove/{trip_id}")
def remove_calendar(trip_id: int, db: Session = Depends(get_db)):
    """Remove all calendar events for a trip."""
    result = remove_trip_from_calendar(db, trip_id)
    return result

# --- Packing Assistant ---

@app.get("/api/packing/{trip_id}")
def get_packing(trip_id: int, db: Session = Depends(get_db)):
    """Get packing list for a trip."""
    items = get_packing_list(db, trip_id)
    return [{"id": i.id, "trip_id": i.trip_id, "category": i.category, "item_name": i.item_name, "is_checked": i.is_checked, "created_by": i.created_by} for i in items]

@app.post("/api/packing/generate/{trip_id}")
def generate_packing(trip_id: int, db: Session = Depends(get_db)):
    """Generate AI-powered packing list."""
    items = generate_packing_list(db, trip_id)
    return {"status": "generated", "count": len(items), "items": [{"id": i.id, "trip_id": i.trip_id, "category": i.category, "item_name": i.item_name, "is_checked": i.is_checked, "created_by": i.created_by} for i in items]}

@app.patch("/api/packing/item/{item_id}")
def patch_packing_item(item_id: int, updates: Dict[str, Any], db: Session = Depends(get_db)):
    """Toggle check or rename a packing item."""
    item = update_packing_item(db, item_id, updates)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"id": item.id, "trip_id": item.trip_id, "category": item.category, "item_name": item.item_name, "is_checked": item.is_checked, "created_by": item.created_by}

@app.delete("/api/packing/item/{item_id}")
def remove_packing_item(item_id: int, db: Session = Depends(get_db)):
    """Delete a packing item."""
    success = delete_packing_item(db, item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"status": "deleted"}

@app.post("/api/packing/{trip_id}/item")
def add_packing_item(trip_id: int, data: Dict[str, Any], db: Session = Depends(get_db)):
    """Add a custom packing item."""
    category = data.get("category", "Other")
    item_name = data.get("item_name", "")
    if not item_name:
        raise HTTPException(status_code=400, detail="item_name is required")
    item = add_custom_item(db, trip_id, category, item_name)
    return {"id": item.id, "trip_id": item.trip_id, "category": item.category, "item_name": item.item_name, "is_checked": item.is_checked, "created_by": item.created_by}

# --- AI Travel Chatbot ---

@app.post("/api/chat")
def send_chat_message(data: Dict[str, Any], db: Session = Depends(get_db)):
    """Send a chat message and receive AI response."""
    user_id = get_default_user_id(db)
    message = data.get("message", "")
    if not message:
        raise HTTPException(status_code=400, detail="message is required")
    result = chat_with_assistant(db, user_id, message)
    return result

@app.get("/api/chat/history")
def get_chat(db: Session = Depends(get_db)):
    """Get chat conversation history."""
    user_id = get_default_user_id(db)
    history = get_chat_history(db, user_id)
    return {"messages": history}

@app.delete("/api/chat/history")
def delete_chat(db: Session = Depends(get_db)):
    """Clear chat conversation history."""
    user_id = get_default_user_id(db)
    clear_chat_history(db, user_id)
    return {"status": "cleared"}



