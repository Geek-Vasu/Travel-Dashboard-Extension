import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    trips = relationship("Trip", back_populates="user", cascade="all, delete-orphan")
    processing_records = relationship("EmailProcessing", back_populates="user", cascade="all, delete-orphan")

class EmailProcessing(Base):
    __tablename__ = "email_processing"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    email_id = Column(String, index=True, nullable=False)
    subject = Column(String, nullable=True)
    sender = Column(String, nullable=True)  # Added for validation
    status = Column(String, default="pending")  # "pending", "processing", "completed", "failed"
    error_message = Column(Text, nullable=True)
    received_at = Column(DateTime, default=datetime.datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)
    
    # Extra validation/extraction audit fields:
    is_travel = Column(JSON, nullable=True)
    confidence_score = Column(Float, nullable=True)
    raw_body = Column(Text, nullable=True)
    cleaned_body = Column(Text, nullable=True)
    openai_response = Column(Text, nullable=True)
    extracted_json = Column(JSON, nullable=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=True)

    user = relationship("User", back_populates="processing_records")
    booking = relationship("Booking")
    trip = relationship("Trip")

class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    trip_name = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String, default="Upcoming")  # "Upcoming", "Ongoing", "Completed"
    ai_summary = Column(Text, nullable=True)
    
    # Calendar sync fields (Phase 2)
    calendar_sync_enabled = Column(String, default=None, nullable=True) # None | "synced" | "error"
    calendar_event_ids = Column(JSON, nullable=True)
    last_calendar_sync = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="trips")
    bookings = relationship("Booking", back_populates="trip", cascade="all, delete-orphan")
    timeline_events = relationship("TimelineEvent", back_populates="trip", cascade="all, delete-orphan")
    insights = relationship("Insight", back_populates="trip", cascade="all, delete-orphan")

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    booking_type = Column(String, nullable=False)  # "flight", "hotel", "train", "cab"
    provider = Column(String, nullable=False)
    cost = Column(Float, default=0.0)
    currency = Column(String, default="INR")
    pnr = Column(String, nullable=True)
    
    # Source Traceability fields
    source_email_id = Column(String, nullable=False)
    source_subject = Column(String, nullable=True)
    source_sender = Column(String, nullable=True)  # Added for validation
    source_snippet = Column(Text, nullable=True)
    source_gmail_link = Column(String, nullable=True)
    
    confidence_score = Column(Float, default=1.0)
    details = Column(JSON, nullable=True)  # Store specific fields like check-in, arrival time, flight number, etc.

    trip = relationship("Trip", back_populates="bookings")

class TimelineEvent(Base):
    __tablename__ = "timeline_events"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    title = Column(String, nullable=False)
    event_time = Column(DateTime, nullable=False)
    event_type = Column(String, nullable=False)  # "flight_dep", "flight_arr", "hotel_checkin", etc.
    location = Column(String, nullable=True)
    description = Column(Text, nullable=True)

    trip = relationship("Trip", back_populates="timeline_events")

class Insight(Base):
    __tablename__ = "insights"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String, default="info")  # "info", "warning", "caution"
    insight_type = Column(String, default="rule_based")  # "rule_based", "ai_summary"

    trip = relationship("Trip", back_populates="insights")

class PackingItem(Base):
    __tablename__ = "packing_items"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    category = Column(String, nullable=False)
    item_name = Column(String, nullable=False)
    is_checked = Column(Integer, default=0)  # 0 = false, 1 = true
    created_by = Column(String, default="ai")  # "ai" | "user"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    trip = relationship("Trip")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String, nullable=False)  # "user" | "assistant"
    content = Column(Text, nullable=False)
    sources = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User")

