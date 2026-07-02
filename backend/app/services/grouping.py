import datetime
from sqlalchemy.orm import Session
from ..models import Trip, Booking
from ..schemas import BookingBase

def parse_date(date_str) -> datetime.date:
    if not date_str:
        return datetime.date.today()
    if isinstance(date_str, datetime.date):
        return date_str
    if isinstance(date_str, datetime.datetime):
        return date_str.date()
    try:
        # ISO format: 2026-07-15T07:00:00
        return datetime.datetime.fromisoformat(date_str).date()
    except Exception:
        try:
            return datetime.datetime.strptime(date_str[:10], "%Y-%m-%d").date()
        except Exception:
            return datetime.date.today()

def get_booking_destination(booking_type: str, details: dict) -> str:
    """Extracts city/destination name from booking details."""
    if not details:
        return "Unknown"
        
    if booking_type == "flight":
        # Usually travel to arrival city
        return details.get("arrival_city") or details.get("departure_city") or "Unknown"
    elif booking_type == "hotel":
        hotel_name = (details.get("hotel_name") or "").lower()
        address = (details.get("address") or "").lower()
        for city in ["mumbai", "goa", "delhi", "bangalore", "pune", "hyderabad", "chennai", "kolkata", "jaipur", "amritsar"]:
            if city in hotel_name or city in address:
                return city.capitalize()
        return details.get("hotel_name") or "Unknown"
    elif booking_type == "train":
        arr = details.get("arrival_station") or ""
        for city in ["mumbai", "goa", "delhi", "bangalore", "pune", "hyderabad", "chennai", "kolkata", "jaipur", "amritsar"]:
            if city in arr.lower():
                return city.capitalize()
        return arr or "Unknown"
    elif booking_type == "cab":
        dropoff = details.get("dropoff_location") or ""
        pickup = details.get("pickup_location") or ""
        for city in ["mumbai", "goa", "delhi", "airport"]:
            if city in dropoff.lower() or city in pickup.lower():
                return "Goa" if city == "goa" else ("Delhi" if city == "delhi" else "Mumbai")
        return "Unknown"
    return "Unknown"

def get_booking_dates(booking_type: str, details: dict) -> tuple[datetime.date, datetime.date]:
    """Returns (start_date, end_date) for a booking."""
    if not details:
        today = datetime.date.today()
        return today, today
        
    start_date = None
    end_date = None
    
    if booking_type == "flight":
        dep = details.get("departure_time")
        arr = details.get("arrival_time") or dep
        start_date = parse_date(dep)
        end_date = parse_date(arr)
    elif booking_type == "hotel":
        check_in = details.get("check_in")
        check_out = details.get("check_out") or check_in
        start_date = parse_date(check_in)
        end_date = parse_date(check_out)
    elif booking_type == "train":
        dep = details.get("departure_time")
        arr = details.get("arrival_time") or dep
        start_date = parse_date(dep)
        end_date = parse_date(arr)
    elif booking_type == "cab":
        pickup = details.get("pickup_time")
        start_date = parse_date(pickup)
        end_date = start_date
        
    return start_date, end_date

def find_or_create_trip(db: Session, user_id: int, destination: str, booking_start: datetime.date, booking_end: datetime.date) -> Trip:
    """
    Finds an existing trip for the user to the same destination that overlaps 
    dates (or falls within a 5-day window of the trip's start/end dates).
    Otherwise, creates a new trip.
    """
    # Look for matching trips
    trips = db.query(Trip).filter(
        Trip.user_id == user_id,
        Trip.destination == destination
    ).all()
    
    threshold_days = 5
    matched_trip = None
    
    for trip in trips:
        # Check if booking date overlaps or is close to trip date range
        # booking_start - 5 days <= trip.end_date AND booking_end + 5 days >= trip.start_date
        if (booking_start - datetime.timedelta(days=threshold_days)) <= trip.end_date and \
           (booking_end + datetime.timedelta(days=threshold_days)) >= trip.start_date:
            matched_trip = trip
            break
            
    current_date = datetime.date(2026, 6, 15) # Current system date from metadata
    
    if matched_trip:
        # Update trip bounds
        matched_trip.start_date = min(matched_trip.start_date, booking_start)
        matched_trip.end_date = max(matched_trip.end_date, booking_end)
        
        # Recalculate status
        if matched_trip.end_date < current_date:
            matched_trip.status = "Completed"
        elif matched_trip.start_date <= current_date <= matched_trip.end_date:
            matched_trip.status = "Ongoing"
        else:
            matched_trip.status = "Upcoming"
            
        db.add(matched_trip)
        db.flush()
        return matched_trip
    else:
        # Create new trip
        # Give a nice business or personal name
        trip_name = f"{destination} Trip"
        dest_lower = (destination or "").lower()
        if dest_lower == "mumbai":
            trip_name = "Mumbai Business Trip"
        elif dest_lower == "goa":
            trip_name = "Goa Summer Vacation"
        elif dest_lower == "delhi":
            trip_name = "Delhi Family Visit"
            
        # Determine status
        if booking_end < current_date:
            status = "Completed"
        elif booking_start <= current_date <= booking_end:
            status = "Ongoing"
        else:
            status = "Upcoming"
            
        new_trip = Trip(
            user_id=user_id,
            trip_name=trip_name,
            destination=destination,
            start_date=booking_start,
            end_date=booking_end,
            status=status
        )
        db.add(new_trip)
        db.flush()
        return new_trip

def add_booking_to_trip(db: Session, user_id: int, raw_booking: dict) -> Booking:
    """
    Applies PNR-based updates/upserts, then matches and puts booking into a trip,
    expanding trip bounds dynamically.
    """
    details = raw_booking.get("details", {}) or {}
    booking_type = raw_booking.get("booking_type") or "flight"
    pnr = raw_booking.get("pnr")
    provider = (raw_booking.get("provider") or "").strip() or "Unknown Provider"
    
    # 1. PNR-Based Update Check
    existing_booking = None
    if pnr:
        existing_booking = db.query(Booking).join(Trip).filter(
            Trip.user_id == user_id,
            Booking.pnr == pnr,
            Booking.provider == provider
        ).first()
        
    if existing_booking:
        old_trip_id = existing_booking.trip_id
        
        # Perform reference upsert
        # Update cost, details, confidence, source details
        existing_booking.cost = raw_booking.get("cost", existing_booking.cost)
        existing_booking.currency = raw_booking.get("currency", existing_booking.currency)
        existing_booking.source_email_id = raw_booking.get("source_email_id")
        existing_booking.source_subject = raw_booking.get("source_subject")
        existing_booking.source_sender = raw_booking.get("source_sender")
        existing_booking.source_snippet = raw_booking.get("source_snippet")
        existing_booking.source_gmail_link = raw_booking.get("source_gmail_link")
        existing_booking.confidence_score = raw_booking.get("confidence_score", existing_booking.confidence_score)
        
        # Merge details using a copy to ensure SQLAlchemy registers the change
        current_details = dict(existing_booking.details or {})
        for k, v in details.items():
            if v is not None or k not in current_details:
                current_details[k] = v
        existing_booking.details = current_details
        
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(existing_booking, "details")
        
        # Re-evaluate trip association based on updated dates
        destination = get_booking_destination(booking_type, current_details)
        booking_start, booking_end = get_booking_dates(booking_type, current_details)
        
        new_trip = find_or_create_trip(db, user_id, destination, booking_start, booking_end)
        existing_booking.trip_id = new_trip.id
        
        db.add(existing_booking)
        db.flush()
        
        # Re-generate timeline or delete the old trip if it has no bookings left
        if old_trip_id and old_trip_id != new_trip.id:
            old_trip_bookings_count = db.query(Booking).filter(Booking.trip_id == old_trip_id).count()
            if old_trip_bookings_count == 0:
                from ..models import TimelineEvent, Insight, PackingItem, EmailProcessing
                db.query(EmailProcessing).filter(EmailProcessing.trip_id == old_trip_id).update(
                    {EmailProcessing.trip_id: None}, synchronize_session=False
                )
                db.query(TimelineEvent).filter(TimelineEvent.trip_id == old_trip_id).delete(synchronize_session=False)
                db.query(Insight).filter(Insight.trip_id == old_trip_id).delete(synchronize_session=False)
                db.query(PackingItem).filter(PackingItem.trip_id == old_trip_id).delete(synchronize_session=False)
                db.query(Trip).filter(Trip.id == old_trip_id).delete(synchronize_session=False)
            else:
                from .timeline import generate_trip_timeline
                generate_trip_timeline(db, old_trip_id)
        return existing_booking

    # 2. Extract booking destination and dates
    destination = get_booking_destination(booking_type, details)
    booking_start, booking_end = get_booking_dates(booking_type, details)
    
    # 3. Locate or create corresponding trip
    trip = find_or_create_trip(db, user_id, destination, booking_start, booking_end)
    
    # 4. Insert booking
    db_booking = Booking(
        trip_id=trip.id,
        booking_type=booking_type,
        provider=provider,
        cost=raw_booking.get("cost", 0.0),
        currency=raw_booking.get("currency", "INR"),
        pnr=pnr,
        source_email_id=raw_booking.get("source_email_id"),
        source_subject=raw_booking.get("source_subject"),
        source_sender=raw_booking.get("source_sender"),
        source_snippet=raw_booking.get("source_snippet"),
        source_gmail_link=raw_booking.get("source_gmail_link"),
        confidence_score=raw_booking.get("confidence_score", 1.0),
        details=details
    )
    db.add(db_booking)
    db.flush()
    return db_booking
