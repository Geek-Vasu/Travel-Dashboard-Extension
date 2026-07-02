from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from ..mock_data import ALL_MOCK_EMAILS
from ..config import settings

class EmailProvider(ABC):
    @abstractmethod
    def fetch_messages(self, limit: int = 15) -> List[Dict[str, Any]]:
        """Fetch list of message summaries (id, subject, sender, date, snippet)"""
        pass

    @abstractmethod
    def get_message_detail(self, message_id: str) -> Optional[Dict[str, Any]]:
        """Fetch complete message details including body content"""
        pass

class MockEmailProvider(EmailProvider):
    def fetch_messages(self, limit: int = 15) -> List[Dict[str, Any]]:
        # Return summaries
        summaries = []
        for msg in ALL_MOCK_EMAILS[:limit]:
            summaries.append({
                "id": msg["id"],
                "subject": msg["subject"],
                "sender": msg["sender"],
                "date": msg["date"],
                "snippet": msg["snippet"]
            })
        return summaries

    def get_message_detail(self, message_id: str) -> Optional[Dict[str, Any]]:
        # Return complete message
        for msg in ALL_MOCK_EMAILS:
            if msg["id"] == message_id:
                return msg
        return None

class GmailEmailProvider(EmailProvider):
    def __init__(self, creds):
        self.creds = creds
        from googleapiclient.discovery import build
        self.service = build('gmail', 'v1', credentials=self.creds)

    def fetch_messages(self, limit: int = 15) -> List[Dict[str, Any]]:
        # Search query looking for travel indicators (excluding noisy invoice/receipt terms)
        query = "subject:(flight OR hotel OR booking OR reservation OR PNR OR confirmation OR ticket)"
        try:
            results = self.service.users().messages().list(userId='me', q=query, maxResults=min(limit, 50)).execute()
            messages = results.get('messages', [])
        except Exception as e:
            raise Exception(f"Gmail API Query Failure: {str(e)}. Please check if your Google API is enabled, or delete token.json to run in simulation/demo mode.")
        
        summaries = []
        for msg in messages:
            msg_id = msg['id']
            try:
                msg_data = self.service.users().messages().get(userId='me', id=msg_id, format='metadata', 
                                                              metadataHeaders=['Subject', 'From', 'Date']).execute()
                headers = msg_data.get('payload', {}).get('headers', [])
                subject = next((h['value'] for h in headers if h['name'].lower() == 'subject'), "No Subject")
                sender = next((h['value'] for h in headers if h['name'].lower() == 'from'), "Unknown Sender")
                date_val = next((h['value'] for h in headers if h['name'].lower() == 'date'), "")
                snippet = msg_data.get('snippet', "")
                
                summaries.append({
                    "id": msg_id,
                    "subject": subject,
                    "sender": sender,
                    "date": date_val,
                    "snippet": snippet
                })
            except Exception as e:
                # Log error and skip
                print(f"Error fetching metadata for message {msg_id}: {e}")
                
        return summaries

    def get_message_detail(self, message_id: str) -> Optional[Dict[str, Any]]:
        try:
            msg_data = self.service.users().messages().get(userId='me', id=message_id, format='full').execute()
            headers = msg_data.get('payload', {}).get('headers', [])
            subject = next((h['value'] for h in headers if h['name'].lower() == 'subject'), "No Subject")
            sender = next((h['value'] for h in headers if h['name'].lower() == 'from'), "Unknown Sender")
            date_val = next((h['value'] for h in headers if h['name'].lower() == 'date'), "")
            snippet = msg_data.get('snippet', "")
            
            # Extract email body (plain text or html)
            body = ""
            payload = msg_data.get('payload', {})
            
            def extract_body(part):
                part_body = ""
                mime_type = part.get('mimeType', '')
                data = part.get('body', {}).get('data', '')
                
                if mime_type == 'text/plain' or mime_type == 'text/html':
                    import base64
                    if data:
                        # Decode base64
                        decoded = base64.urlsafe_b64decode(data).decode('utf-8', errors='ignore')
                        part_body += decoded
                
                parts = part.get('parts', [])
                for subpart in parts:
                    part_body += extract_body(subpart)
                    
                return part_body

            body = extract_body(payload)
            if not body:
                # Fallback to body from direct payload body data
                data = payload.get('body', {}).get('data', '')
                if data:
                    import base64
                    body = base64.urlsafe_b64decode(data).decode('utf-8', errors='ignore')
                    
            return {
                "id": message_id,
                "subject": subject,
                "sender": sender,
                "date": date_val,
                "snippet": snippet,
                "body": body or snippet
            }
        except Exception as e:
            print(f"Error fetching message body for {message_id}: {e}")
            return None

def get_email_provider(creds=None) -> EmailProvider:
    if creds:
        return GmailEmailProvider(creds)
        
    import os
    import json
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request
    
    token_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "token.json")
    if os.path.exists(token_path):
        try:
            with open(token_path, "r") as f:
                info = json.load(f)
            # Remove metadata keys before instantiating Credentials
            user_email = info.pop("user_email", None)
            user_name = info.pop("user_name", None)
            
            creds = Credentials.from_authorized_user_info(info)
            if creds:
                if creds.expired and creds.refresh_token:
                    creds.refresh(Request())
                    # Resave refreshed credentials + metadata
                    refreshed_info = json.loads(creds.to_json())
                    refreshed_info["user_email"] = user_email
                    refreshed_info["user_name"] = user_name
                    with open(token_path, "w") as f:
                        json.dump(refreshed_info, f, indent=2)
                return GmailEmailProvider(creds)
        except Exception as e:
            print(f"Error loading credentials from token.json: {e}")
            
    return MockEmailProvider()
