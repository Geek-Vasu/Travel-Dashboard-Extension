import json
import datetime
from sqlalchemy.orm import Session
from ..models import Trip, Booking, PackingItem
from ..config import settings

DEFAULT_PACKING = {
    "Documents": ["Government ID / Passport", "Boarding Pass (printed)", "Hotel Booking Confirmation", "Travel Insurance Papers"],
    "Clothing": ["Formal Shirts", "Casual T-Shirts", "Trousers / Pants", "Undergarments", "Sleepwear", "Comfortable Shoes"],
    "Electronics": ["Phone Charger", "Power Bank", "Earphones / Headphones", "Laptop + Charger"],
    "Toiletries": ["Toothbrush & Toothpaste", "Deodorant", "Sunscreen", "Shampoo (travel size)", "Hand Sanitizer"],
    "Medicine": ["First Aid Kit", "Prescribed Medications", "Pain Relief Tablets", "Band-Aids"],
    "Accessories": ["Sunglasses", "Umbrella / Raincoat", "Wallet / Purse", "Watch", "Neck Pillow (for flights)"]
}

def _get_trip_context(db: Session, trip_id: int) -> dict:
    """Build context about a trip for AI packing generation."""
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        return {}
    
    bookings = db.query(Booking).filter(Booking.trip_id == trip_id).all()
    duration = (trip.end_date - trip.start_date).days + 1
    
    has_flights = any(b.booking_type == "flight" for b in bookings)
    has_hotels = any(b.booking_type == "hotel" for b in bookings)
    has_trains = any(b.booking_type == "train" for b in bookings)
    
    booking_summary = ", ".join([f"{b.booking_type.capitalize()} with {b.provider}" for b in bookings])
    
    # Determine trip type
    trip_type = "business" if "business" in trip.trip_name.lower() else "leisure"
    if "family" in trip.trip_name.lower():
        trip_type = "family"
    
    return {
        "destination": trip.destination,
        "duration": duration,
        "start_date": str(trip.start_date),
        "end_date": str(trip.end_date),
        "trip_type": trip_type,
        "has_flights": has_flights,
        "has_hotels": has_hotels,
        "has_trains": has_trains,
        "booking_summary": booking_summary,
        "trip_name": trip.trip_name
    }


def generate_packing_list(db: Session, trip_id: int) -> list:
    """Generate a packing list using AI or fallback to templates."""
    # Clear existing AI-generated items
    db.query(PackingItem).filter(
        PackingItem.trip_id == trip_id,
        PackingItem.created_by == "ai"
    ).delete(synchronize_session=False)
    db.commit()
    
    context = _get_trip_context(db, trip_id)
    categories = {}
    
    # Try OpenAI generation
    if settings.openai_api_key and settings.openai_api_key.strip():
        try:
            from openai import OpenAI
            client = OpenAI(api_key=settings.openai_api_key)
            
            prompt = f"""You are a travel packing assistant. Generate a personalized packing checklist for this trip.

Trip Details:
- Destination: {context.get('destination', 'Unknown')}
- Duration: {context.get('duration', 3)} days
- Dates: {context.get('start_date')} to {context.get('end_date')}
- Trip Type: {context.get('trip_type', 'leisure')}
- Bookings: {context.get('booking_summary', 'None')}
- Has Flights: {context.get('has_flights', False)}
- Has Hotels: {context.get('has_hotels', False)}

Return JSON only. No markdown. Format:
{{
  "categories": [
    {{
      "name": "Documents",
      "items": ["item1", "item2"]
    }}
  ]
}}

Include categories: Documents, Clothing, Electronics, Toiletries, Medicine, Accessories.
Tailor items to the destination, duration, and trip type.
Keep each category to 4-6 items max."""
            
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.7
            )
            result = json.loads(response.choices[0].message.content)
            for cat in result.get("categories", []):
                categories[cat["name"]] = cat["items"]
        except Exception as e:
            print(f"AI packing generation failed, using templates: {e}")
            categories = {}
    
    # Fallback to templates
    if not categories:
        categories = dict(DEFAULT_PACKING)
        # Customize based on context
        if context.get("trip_type") == "business":
            categories["Clothing"] = ["Formal Shirts", "Blazer / Suit", "Formal Shoes", "Belt & Tie", "Undergarments", "Casual Evening Wear"]
        if context.get("has_flights"):
            if "Neck Pillow (for flights)" not in categories.get("Accessories", []):
                categories.setdefault("Accessories", []).append("Neck Pillow (for flights)")
    
    # Insert into database
    items = []
    for category, item_list in categories.items():
        for item_name in item_list:
            item = PackingItem(
                trip_id=trip_id,
                category=category,
                item_name=item_name,
                is_checked=0,
                created_by="ai"
            )
            db.add(item)
            items.append(item)
    
    db.commit()
    for item in items:
        db.refresh(item)
    
    return items


def get_packing_list(db: Session, trip_id: int) -> list:
    """Get all packing items for a trip."""
    return db.query(PackingItem).filter(
        PackingItem.trip_id == trip_id
    ).order_by(PackingItem.category, PackingItem.id).all()


def update_packing_item(db: Session, item_id: int, updates: dict):
    """Toggle check or rename a packing item."""
    item = db.query(PackingItem).filter(PackingItem.id == item_id).first()
    if not item:
        return None
    
    if "is_checked" in updates:
        item.is_checked = int(updates["is_checked"])
    if "item_name" in updates:
        item.item_name = updates["item_name"]
    
    db.commit()
    db.refresh(item)
    return item


def delete_packing_item(db: Session, item_id: int) -> bool:
    """Delete a packing item."""
    item = db.query(PackingItem).filter(PackingItem.id == item_id).first()
    if not item:
        return False
    db.delete(item)
    db.commit()
    return True


def add_custom_item(db: Session, trip_id: int, category: str, item_name: str):
    """Add a user-created packing item."""
    item = PackingItem(
        trip_id=trip_id,
        category=category,
        item_name=item_name,
        is_checked=0,
        created_by="user"
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item
