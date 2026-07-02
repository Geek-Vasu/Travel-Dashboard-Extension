import sys
import os

backend_path = r"c:\Users\LENOVO\Documents\travel\backend"
sys.path.insert(0, backend_path)

try:
    from app.database import engine
    from app.models import EmailProcessing
    from sqlalchemy.orm import sessionmaker
    
    Session = sessionmaker(bind=engine)
    db = Session()
    
    records = db.query(EmailProcessing).filter(EmailProcessing.booking_id == 165).all()
    print(f"Found {len(records)} email records for Jaipur booking:")
    for r in records:
        print(f"Subject: {r.subject}")
        print(f"Sender: {r.sender}")
        print(f"Is Travel: {r.is_travel}")
        print(f"Confidence Score: {r.confidence_score}")
        print(f"Cleaned Body Snippet: {r.cleaned_body[:300] if r.cleaned_body else 'None'}")
        print(f"OpenAI Response: {r.openai_response}")
        
except Exception as e:
    import traceback
    traceback.print_exc()
