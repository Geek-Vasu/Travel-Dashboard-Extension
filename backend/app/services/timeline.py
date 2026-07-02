import datetime
from sqlalchemy.orm import Session
from ..models import Booking, TimelineEvent, Trip

def parse_iso_datetime(dt_str) -> datetime.datetime:
    if not dt_str:
        return datetime.datetime.utcnow()
    if isinstance(dt_str, datetime.datetime):
        return dt_str
    try:
        return datetime.datetime.fromisoformat(dt_str)
    except Exception:
        try:
            return datetime.datetime.strptime(dt_str[:16], "%Y-%m-%dT%H:%M")
        except Exception:
            return datetime.datetime.utcnow()

def generate_trip_timeline(db: Session, trip_id: int) -> list[TimelineEvent]:
    """
    Clears old timeline events for the trip and generates new ones based on 
    all currently associated bookings, sorted chronologically.
    """
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        return []
        
    # Clear old timeline events via ORM relationship to avoid out-of-sync session cache/duplicate commits
    trip.timeline_events.clear()
    db.flush()
    
    bookings = db.query(Booking).filter(Booking.trip_id == trip_id).all()
    events = []
    
    for booking in bookings:
        details = booking.details or {}
        b_type = booking.booking_type
        
        if b_type == "flight":
            dep_time_str = details.get("departure_time")
            arr_time_str = details.get("arrival_time") or dep_time_str
            
            dep_time = parse_iso_datetime(dep_time_str)
            arr_time = parse_iso_datetime(arr_time_str)
            
            flight_num = details.get("flight_number") or booking.provider
            dep_city = details.get("departure_city") or "Source"
            arr_city = details.get("arrival_city") or "Destination"
            
            events.append(TimelineEvent(
                trip_id=trip_id,
                title=f"Flight Departure ({flight_num})",
                event_time=dep_time,
                event_type="flight_dep",
                location=dep_city,
                description=f"Fly from {dep_city} to {arr_city} via {booking.provider}. PNR: {booking.pnr or 'N/A'}"
            ))
            
            events.append(TimelineEvent(
                trip_id=trip_id,
                title=f"Flight Arrival ({flight_num})",
                event_time=arr_time,
                event_type="flight_arr",
                location=arr_city,
                description=f"Arrive at {arr_city} Airport. Welcome!"
            ))
            
        elif b_type == "hotel":
            check_in_str = details.get("check_in")
            check_out_str = details.get("check_out") or check_in_str
            
            check_in_time = parse_iso_datetime(check_in_str)
            check_out_time = parse_iso_datetime(check_out_str)
            
            hotel_name = details.get("hotel_name") or booking.provider
            address = details.get("address") or ""
            
            events.append(TimelineEvent(
                trip_id=trip_id,
                title="Hotel Check-In",
                event_time=check_in_time,
                event_type="hotel_checkin",
                location=hotel_name,
                description=f"Check-in at {hotel_name}. Address: {address}. Booking Ref: {booking.pnr or 'N/A'}"
            ))
            
            events.append(TimelineEvent(
                trip_id=trip_id,
                title="Hotel Check-Out",
                event_time=check_out_time,
                event_type="hotel_checkout",
                location=hotel_name,
                description=f"Check-out of {hotel_name} by 12:00 PM."
            ))
            
        elif b_type == "train":
            dep_time_str = details.get("departure_time")
            arr_time_str = details.get("arrival_time") or dep_time_str
            
            dep_time = parse_iso_datetime(dep_time_str)
            arr_time = parse_iso_datetime(arr_time_str)
            
            train_name = details.get("train_name") or booking.provider
            dep_station = details.get("departure_station") or "Source Station"
            arr_station = details.get("arrival_station") or "Dest Station"
            seat = details.get("seat_number") or "N/A"
            
            events.append(TimelineEvent(
                trip_id=trip_id,
                title=f"Train Boarding ({train_name})",
                event_time=dep_time,
                event_type="train_dep",
                location=dep_station,
                description=f"Board train {train_name} from {dep_station}. Seat: {seat}. PNR: {booking.pnr or 'N/A'}"
            ))
            
            events.append(TimelineEvent(
                trip_id=trip_id,
                title=f"Train Arrival ({train_name})",
                event_time=arr_time,
                event_type="train_arr",
                location=arr_station,
                description=f"Arrive at {arr_station} Station."
            ))
            
        elif b_type == "cab":
            pickup_str = details.get("pickup_time")
            pickup_time = parse_iso_datetime(pickup_str)
            
            pickup_loc = details.get("pickup_location") or "Pickup Point"
            dropoff_loc = details.get("dropoff_location") or "Destination"
            
            events.append(TimelineEvent(
                trip_id=trip_id,
                title="Cab Pickup",
                event_time=pickup_time,
                event_type="cab_pickup",
                location=pickup_loc,
                description=f"Ride with {booking.provider} from {pickup_loc} to {dropoff_loc}."
            ))
            
    # Sort generated events chronologically
    events.sort(key=lambda x: x.event_time)
    
    for e in events:
        db.add(e)
        
    db.flush()
    return events
