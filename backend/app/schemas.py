from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, date

class UserBase(BaseModel):
    email: str
    name: Optional[str] = None

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class EmailProcessingResponse(BaseModel):
    id: int
    email_id: str
    subject: Optional[str] = None
    status: str
    error_message: Optional[str] = None
    received_at: datetime
    processed_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class BookingBase(BaseModel):
    booking_type: str  # "flight", "hotel", "train", "cab"
    provider: str
    cost: float
    currency: str
    pnr: Optional[str] = None
    source_email_id: str
    source_subject: Optional[str] = None
    source_sender: Optional[str] = None
    source_snippet: Optional[str] = None
    source_gmail_link: Optional[str] = None
    confidence_score: float
    details: Optional[Dict[str, Any]] = None

class BookingResponse(BookingBase):
    id: int
    trip_id: int
    model_config = ConfigDict(from_attributes=True)

class TimelineEventBase(BaseModel):
    title: str
    event_time: datetime
    event_type: str
    location: Optional[str] = None
    description: Optional[str] = None

class TimelineEventResponse(TimelineEventBase):
    id: int
    trip_id: int
    model_config = ConfigDict(from_attributes=True)

class InsightBase(BaseModel):
    message: str
    severity: str  # "info", "warning", "caution"
    insight_type: str  # "rule_based", "ai_summary"

class InsightResponse(InsightBase):
    id: int
    trip_id: int
    model_config = ConfigDict(from_attributes=True)

class TripBase(BaseModel):
    trip_name: str
    destination: str
    start_date: date
    end_date: date
    status: str
    ai_summary: Optional[str] = None

class TripResponse(TripBase):
    id: int
    user_id: int
    bookings_count: int = 0
    model_config = ConfigDict(from_attributes=True)

class DetailedTripResponse(TripResponse):
    bookings: List[BookingResponse] = []
    timeline_events: List[TimelineEventResponse] = []
    insights: List[InsightResponse] = []
    model_config = ConfigDict(from_attributes=True)

# Analytics Data Schemas
class CategorySpend(BaseModel):
    category: str
    spend: float

class MonthlySpend(BaseModel):
    month: str
    spend: float

class DashboardStats(BaseModel):
    total_trips: int
    upcoming_trips: int
    total_spend: float
    bookings_found: int

class DashboardData(BaseModel):
    stats: DashboardStats
    upcoming_trip: Optional[DetailedTripResponse] = None
    trips: List[TripResponse] = []

class ValidationRecordResponse(BaseModel):
    id: int
    email_id: str
    subject: Optional[str] = None
    sender: Optional[str] = None
    status: str
    error_message: Optional[str] = None
    received_at: datetime
    processed_at: Optional[datetime] = None
    
    is_travel: Optional[Any] = None
    confidence_score: Optional[float] = None
    raw_body: Optional[str] = None
    cleaned_body: Optional[str] = None
    openai_response: Optional[str] = None
    extracted_json: Optional[Dict[str, Any]] = None
    
    booking_id: Optional[int] = None
    trip_id: Optional[int] = None
    
    booking: Optional[BookingResponse] = None
    trip: Optional[DetailedTripResponse] = None
    
    model_config = ConfigDict(from_attributes=True)

