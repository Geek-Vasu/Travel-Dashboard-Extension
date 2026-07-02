import os
import json
import datetime
from sqlalchemy.orm import Session
from googleapiclient.errors import HttpError
from ..models import Trip, TimelineEvent, Booking
from ..config import settings

CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events"

def get_calendar_credentials():
    """Load and validate credentials with calendar scope from token.json."""
    token_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "token.json")
    if not os.path.exists(token_path):
        return None, "no_token"
    
    try:
        from google.oauth2.credentials import Credentials
        from google.auth.transport.requests import Request
        
        with open(token_path, "r") as f:
            info = json.load(f)
        
        user_email = info.pop("user_email", None)
        user_name = info.pop("user_name", None)
        
        scopes = info.get("scopes", [])
        if CALENDAR_SCOPE not in scopes:
            # Restore metadata
            info["user_email"] = user_email
            info["user_name"] = user_name
            return None, "needs_calendar_scope"
        
        creds = Credentials.from_authorized_user_info(info)
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
            refreshed = json.loads(creds.to_json())
            refreshed["user_email"] = user_email
            refreshed["user_name"] = user_name
            with open(token_path, "w") as f:
                json.dump(refreshed, f, indent=2)
        
        # Restore metadata
        info["user_email"] = user_email
        info["user_name"] = user_name
        
        return creds, "ok"
    except Exception as e:
        print(f"Calendar credentials error: {e}")
        return None, f"error: {str(e)}"


def _build_calendar_event(event: TimelineEvent) -> dict:
    """Convert a TimelineEvent to a Google Calendar event body."""
    # Duration mapping: most events are ~30min to 2hrs
    duration_map = {
        "flight_dep": 120, "flight_arr": 30, 
        "hotel_checkin": 60, "hotel_checkout": 60,
        "train_dep": 180, "train_arr": 30,
        "cab_pickup": 60
    }
    duration_mins = duration_map.get(event.event_type, 60)
    
    color_map = {
        "flight_dep": "9", "flight_arr": "9",   # Blueberry
        "hotel_checkin": "2", "hotel_checkout": "2",  # Sage
        "train_dep": "6", "train_arr": "6",     # Tangerine
        "cab_pickup": "8"                          # Graphite
    }
    
    start_dt = event.event_time
    end_dt = start_dt + datetime.timedelta(minutes=duration_mins)
    
    cal_event = {
        "summary": event.title,
        "description": event.description or "",
        "location": event.location or "",
        "start": {
            "dateTime": start_dt.isoformat(),
            "timeZone": "Asia/Kolkata"
        },
        "end": {
            "dateTime": end_dt.isoformat(),
            "timeZone": "Asia/Kolkata"
        },
        "colorId": color_map.get(event.event_type, "1"),
        "reminders": {
            "useDefault": False,
            "overrides": [{"method": "popup", "minutes": 60}]
        }
    }
    return cal_event


def sync_trip_to_calendar(db: Session, trip_id: int) -> dict:
    """Sync all timeline events for a trip to Google Calendar."""
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        return {"status": "error", "message": "Trip not found"}
    
    creds, creds_status = get_calendar_credentials()
    if not creds:
        if creds_status == "needs_calendar_scope":
            # Build re-auth URL with calendar scope included
            if settings.google_client_id:
                scopes = "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid https://www.googleapis.com/auth/calendar.events"
                auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id={settings.google_client_id}&redirect_uri={settings.google_redirect_uri}&scope={scopes}&access_type=offline&prompt=consent"
                return {"status": "needs_reauth", "message": "Calendar permission required", "auth_url": auth_url}
        return {"status": "error", "message": f"Credentials unavailable: {creds_status}"}
    
    try:
        from googleapiclient.discovery import build
        service = build('calendar', 'v3', credentials=creds)
        
        # Remove existing events if any
        existing_ids = trip.calendar_event_ids or []
        for eid in existing_ids:
            try:
                service.events().delete(calendarId='primary', eventId=eid).execute()
            except Exception:
                pass  # Event may already be deleted
        
        # Get timeline events
        events = db.query(TimelineEvent).filter(TimelineEvent.trip_id == trip_id).order_by(TimelineEvent.event_time.asc()).all()
        
        new_event_ids = []
        for evt in events:
            cal_event = _build_calendar_event(evt)
            cal_event["summary"] = f"🧳 {cal_event['summary']}"
            cal_event["description"] = f"Trip: {trip.trip_name}\n{cal_event['description']}"
            
            result = service.events().insert(calendarId='primary', body=cal_event).execute()
            new_event_ids.append(result['id'])
        
        # Update trip record
        trip.calendar_sync_enabled = "synced"
        trip.calendar_event_ids = new_event_ids
        trip.last_calendar_sync = datetime.datetime.utcnow()
        db.commit()
        
        return {"status": "synced", "message": f"{len(new_event_ids)} events synced", "event_count": len(new_event_ids)}
    except HttpError as e:
        trip.calendar_sync_enabled = "error"
        db.commit()
        print(f"Calendar sync HttpError: {e}")
        if e.resp.status == 403 and ("insufficient" in str(e).lower() or "permission" in str(e).lower()):
            if settings.google_client_id:
                scopes = "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid https://www.googleapis.com/auth/calendar.events"
                auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id={settings.google_client_id}&redirect_uri={settings.google_redirect_uri}&scope={scopes}&access_type=offline&prompt=consent"
                return {"status": "needs_reauth", "message": "Google Calendar permissions revoked or insufficient. Re-authorization required.", "auth_url": auth_url}
        return {"status": "error", "message": f"Google Calendar API Error: {str(e)}"}
    except Exception as e:
        trip.calendar_sync_enabled = "error"
        db.commit()
        print(f"Calendar sync error: {e}")
        return {"status": "error", "message": str(e)}


def remove_trip_from_calendar(db: Session, trip_id: int) -> dict:
    """Remove all calendar events for a trip."""
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        return {"status": "error", "message": "Trip not found"}
    
    existing_ids = trip.calendar_event_ids or []
    if not existing_ids:
        return {"status": "ok", "message": "No events to remove"}
    
    creds, creds_status = get_calendar_credentials()
    if not creds:
        return {"status": "error", "message": f"Credentials unavailable: {creds_status}"}
    
    try:
        from googleapiclient.discovery import build
        service = build('calendar', 'v3', credentials=creds)
        
        removed = 0
        for eid in existing_ids:
            try:
                service.events().delete(calendarId='primary', eventId=eid).execute()
                removed += 1
            except Exception:
                pass
        
        trip.calendar_sync_enabled = None
        trip.calendar_event_ids = None
        trip.last_calendar_sync = None
        db.commit()
        
        return {"status": "removed", "message": f"{removed} events removed"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


def get_calendar_sync_status(db: Session, trip_id: int) -> dict:
    """Get the calendar sync status for a trip."""
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        return {"status": "error", "message": "Trip not found"}
    
    return {
        "sync_status": trip.calendar_sync_enabled,
        "event_count": len(trip.calendar_event_ids) if trip.calendar_event_ids else 0,
        "last_sync": trip.last_calendar_sync.isoformat() + "Z" if trip.last_calendar_sync else None
    }
