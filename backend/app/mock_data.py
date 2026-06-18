import datetime

# 12 Travel-related emails that will resolve into 3 distinct trips:
# 1. Mumbai Business Trip (Upcoming: July 15 - July 18, 2026)
# 2. Goa Vacation (Completed: January 10 - January 15, 2026)
# 3. Delhi Family Visit (Ongoing: June 12 - June 20, 2026. Note current local date is June 15, 2026)
TRAVEL_EMAILS = [
    # ---- Trip 1: Mumbai Business Trip (Upcoming) ----
    {
        "id": "m1",
        "subject": "IndiGo E-Ticket Confirmation - Delhi to Mumbai (PNR: 6E5678)",
        "sender": "reservations@goindigo.in",
        "date": "2026-07-01T10:15:00Z",
        "snippet": "Thanks for choosing IndiGo. Your flight 6E-512 from Delhi (DEL) to Mumbai (BOM) is confirmed. PNR: 6E5678. Departure: 15 July 2026 at 07:00 AM. Arrival: 15 July 2026 at 09:15 AM. Base fare: INR 6,500. Seat 12F. Carry government ID.",
        "body": """
        <html>
        <body style="font-family: Arial;">
            <div style="background-color: #0f2d59; color: white; padding: 20px;">
                <h2>IndiGo Booking Confirmation</h2>
                <p>Flight 6E-512 has been successfully booked.</p>
            </div>
            <div style="padding: 20px;">
                <p><strong>Passenger:</strong> Vasu Dev</p>
                <p><strong>PNR Reference:</strong> 6E5678</p>
                <p><strong>Flight Number:</strong> 6E-512 (Economy)</p>
                <table border="1" cellpadding="5" style="border-collapse: collapse;">
                    <tr>
                        <th>From</th>
                        <th>To</th>
                        <th>Date & Time</th>
                        <th>Status</th>
                    </tr>
                    <tr>
                        <td>Delhi (DEL)</td>
                        <td>Mumbai (BOM)</td>
                        <td>15 July 2026, 07:00 AM</td>
                        <td>CONFIRMED</td>
                    </tr>
                </table>
                <p>Arrival in Mumbai scheduled at 09:15 AM. Seat: 12F.</p>
                <p><strong>Total Fare Paid:</strong> INR 6,500.00 (Inclusive of taxes)</p>
                <p>Please print this boarding pass. Check-in opens 24 hours prior to departure.</p>
            </div>
            <div style="font-size: 10px; color: #888;">
                This is an automated email. Unsubscribe from marketing notifications by clicking here.
                All rights reserved IndiGo Airlines 2026.
            </div>
        </body>
        </html>
        """
    },
    {
        "id": "m2",
        "subject": "Reservation Confirmed: Taj Lands End, Mumbai",
        "sender": "reservations@tajhotels.com",
        "date": "2026-07-02T14:30:00Z",
        "snippet": "Taj Lands End Booking Confirmation: Ref TJ9876. Check-in: 15 July 2026 (02:00 PM). Check-out: 18 July 2026 (12:00 PM). Room: Deluxe Sea View. Total Stay Cost: INR 24,000. We look forward to welcoming you.",
        "body": """
        <div>
            <h2>Taj Lands End, Mumbai</h2>
            <p>Dear Vasu Dev, your stay is confirmed.</p>
            <ul>
                <li><strong>Confirmation Number:</strong> TJ9876</li>
                <li><strong>Check-in Date:</strong> 15 July 2026 (From 2:00 PM onwards)</li>
                <li><strong>Check-out Date:</strong> 18 July 2026 (By 12:00 PM)</li>
                <li><strong>Total Cost:</strong> INR 24,000.00</li>
                <li><strong>Address:</strong> Bandstand, Bandra West, Mumbai, Maharashtra 400050</li>
            </ul>
            <p>Note: Please present a government-issued photo ID at the time of check-in.</p>
        </div>
        """
    },
    {
        "id": "m3",
        "subject": "Your ride with Uber on July 15",
        "sender": "uber.india@uber.com",
        "date": "2026-07-15T10:10:00Z",
        "snippet": "Thanks for riding, Vasu! Here is your receipt for your UberGo ride from Chhatrapati Shivaji Maharaj Airport (T2) to Taj Lands End. Total cost: INR 850.00. Paid via Credit Card.",
        "body": """
        <div>
            <h2>Uber Ride Receipt</h2>
            <p>Total: INR 850.00</p>
            <p><strong>Trip Details:</strong></p>
            <p>Pickup: CSM International Airport Terminal 2, Mumbai at 09:45 AM</p>
            <p>Dropoff: Taj Lands End, Bandra, Mumbai at 10:15 AM</p>
            <p>Fare Details: Base fare INR 750 + Toll/Taxes INR 100 = INR 850.</p>
        </div>
        """
    },
    {
        "id": "m4",
        "subject": "Ola Cab Booking Confirmation for July 18",
        "sender": "bookings@olacabs.com",
        "date": "2026-07-17T18:00:00Z",
        "snippet": "Your Ola ride is scheduled. Pickup: Taj Lands End, Mumbai on 18 July 2026 at 10:30 AM. Destination: Mumbai Airport T2. Estimated Fare: INR 750. Driver details will be sent 15 mins prior.",
        "body": """
        <div>
            <h3>Ola Cab Confirmation</h3>
            <p>Your ride is scheduled on <strong>18 July 2026</strong>.</p>
            <p><strong>Pickup Time:</strong> 10:30 AM</p>
            <p><strong>From:</strong> Taj Lands End, Bandra, Mumbai</p>
            <p><strong>To:</strong> Chhatrapati Shivaji Maharaj International Airport (T2)</p>
            <p><strong>Estimated Bill:</strong> INR 750.00</p>
        </div>
        """
    },
    {
        "id": "m5",
        "subject": "Air India Ticket Booking: Mumbai (BOM) to Delhi (DEL) - CONFIRMED",
        "sender": "e-ticket@airindia.in",
        "date": "2026-07-03T11:00:00Z",
        "snippet": "Air India Reservation Confirmed. Flight AI987 from Mumbai (BOM) to Delhi (DEL). Date: 18 July 2026. Departure: 01:00 PM. Arrival: 03:15 PM. Booking Reference PNR: AI987B. Total Paid: INR 7,200.",
        "body": """
        <div>
            <h2>Air India E-Ticket</h2>
            <p><strong>Booking PNR:</strong> AI987B</p>
            <p><strong>Flight:</strong> AI987 (BOM to DEL)</p>
            <p><strong>Departure:</strong> 18 July 2026 at 13:00 (BOM Terminal 2)</p>
            <p><strong>Arrival:</strong> 18 July 2026 at 15:15 (DEL Terminal 3)</p>
            <p><strong>Total Price:</strong> INR 7,200.00</p>
        </div>
        """
    },
    {
        "id": "m6",
        "subject": "Invoice Statement - Taj Lands End (Ref: TJ9876)",
        "sender": "billing@tajhotels.com",
        "date": "2026-07-18T12:15:00Z",
        "snippet": "Dear Vasu Dev, thank you for staying with us. Please find your final invoice summary for Booking Ref TJ9876. Total charged: INR 27,000 (Room rate INR 24,000 + Dining charges INR 3,000). Payment completed via Card.",
        "body": """
        <div>
            <h3>Taj Hotels - Final Invoice Statement</h3>
            <p>Booking ID: TJ9876</p>
            <p>Room Charges: INR 24,000.00</p>
            <p>In-Room Dining Add-ons: INR 3,000.00</p>
            <p><strong>Total Amount Billed:</strong> INR 27,000.00</p>
            <p>Status: PAID IN FULL</p>
        </div>
        """
    },

    # ---- Trip 2: Goa Vacation (Completed) ----
    {
        "id": "g1",
        "subject": "SpiceJet Flight Booking - Delhi to Goa (PNR: SG7890)",
        "sender": "flights@spicejet.com",
        "date": "2025-12-15T09:00:00Z",
        "snippet": "SpiceJet E-ticket confirmed. PNR: SG7890. Flight SG-245 from Delhi (DEL) to Goa (GOI). Date: 10 Jan 2026. Departs 09:30 AM, Arrives 12:15 PM. Total Cost: INR 8,000.",
        "body": "<div>SpiceJet Confirmation. Flight SG-245 DEL -> GOI on 10 Jan 2026. PNR SG7890. Departure 09:30, Arrival 12:15. Total Cost: INR 8,000.00</div>"
    },
    {
        "id": "g2",
        "subject": "Hotel Booking Confirmed: Novotel Goa Resort & Spa",
        "sender": "booking-confirmation@accor.com",
        "date": "2025-12-16T12:00:00Z",
        "snippet": "Your reservation at Novotel Goa Resort & Spa is confirmed. Check-in: 10 January 2026. Check-out: 15 January 2026. Confirmation ID: NV55421. Total Cost: INR 30,000.",
        "body": "<div>Novotel Goa Confirmation. Check-in: 10 Jan 2026, Check-out: 15 Jan 2026. Confirmation ID: NV55421. Address: Candolim, Goa. Cost: INR 30,000.00</div>"
    },
    {
        "id": "g3",
        "subject": "Goa Airport Cab Service Booking Receipt",
        "sender": "airport-taxi@goacabs.in",
        "date": "2026-01-10T13:30:00Z",
        "snippet": "Booking Confirmed. Airport Taxi service from Goa Airport (GOI) to Novotel Resort. Pickup date: 10 Jan 2026 at 12:30 PM. Cost: INR 1,200. Paid cash.",
        "body": "<div>Goa Taxi booking. Pickup Goa Airport GOI at 12:30 PM on 10 Jan 2026. Dropoff Novotel Goa. Total paid: INR 1,200.00</div>"
    },
    {
        "id": "g4",
        "subject": "IndiGo E-Ticket Confirmation - Goa to Delhi (PNR: 6E2435)",
        "sender": "reservations@goindigo.in",
        "date": "2025-12-18T15:00:00Z",
        "snippet": "Flight 6E-902 from Goa (GOI) to Delhi (DEL) on 15 Jan 2026 is confirmed. PNR: 6E2435. Departure: 05:00 PM. Arrival: 07:30 PM. Fare Paid: INR 7,500.",
        "body": "<div>IndiGo flight 6E-902. Goa GOI to Delhi DEL. 15 Jan 2026. PNR 6E2435. Departs 17:00, Arrives 19:30. Total Cost: INR 7,500.00</div>"
    },

    # ---- Trip 3: Delhi Family Visit (Ongoing) ----
    {
        "id": "d1",
        "subject": "IRCTC Ticket Booking Confirmation - PNR: 2345678",
        "sender": "ticketadmin@irctc.co.in",
        "date": "2026-06-01T08:00:00Z",
        "snippet": "IRCTC booking successful. PNR: 2345678. Train: Shatabdi Express (12014) from Amritsar (ASR) to New Delhi (NDLS). Date of Journey: 12 June 2026. Class: CC. Seat: C1-42. Fare: INR 1,200.",
        "body": "<div>IRCTC Ticket Confirmation. PNR 2345678. Journey Date: 12 June 2026. Amritsar ASR -> New Delhi NDLS. Train: 12014. Seat C1-42. Total Fare: INR 1,200.00</div>"
    },
    {
        "id": "d2",
        "subject": "Booking Confirmed: Radisson Blu Plaza Delhi Airport",
        "sender": "reservations@radisson.com",
        "date": "2026-06-02T10:00:00Z",
        "snippet": "Your stay at Radisson Blu Plaza Delhi is confirmed. Check-in: 12 June 2026. Check-out: 20 June 2026. Booking Reference: RD45623. Total Cost: INR 25,000.",
        "body": "<div>Radisson Blu Delhi Confirmation. Check-in: 12 Jun 2026, Check-out: 20 Jun 2026. Booking Ref: RD45623. Total Price: INR 25,000.00</div>"
    },
    {
        "id": "d3",
        "subject": "IRCTC Ticket Return Journey Confirmation - PNR: 8765432",
        "sender": "ticketadmin@irctc.co.in",
        "date": "2026-06-01T08:15:00Z",
        "snippet": "IRCTC booking successful. PNR: 8765432. Train: Shatabdi Express (12013) from New Delhi (NDLS) to Amritsar (ASR). Date of Journey: 20 June 2026. Class: CC. Seat: C2-12. Fare: INR 1,200.",
        "body": "<div>IRCTC Ticket Return Confirmation. PNR 8765432. Journey Date: 20 June 2026. New Delhi NDLS -> Amritsar ASR. Train: 12013. Seat C2-12. Total Fare: INR 1,200.00</div>"
    }
]

# Generate 90+ non-travel emails to make the scan size 100+ (filters out irrelevant data)
NON_TRAVEL_EMAILS = []
SPAM_SUBJECTS = [
    ("GitHub Alerts", "noreply@github.com", "[GitHub] Security Alert: dependency vulnerability found in node_modules"),
    ("Medium Daily Digest", "digest@medium.com", "Stories from Python Developers and Tech Innovators you follow"),
    ("LinkedIn Jobs", "jobs-noreply@linkedin.com", "Vasu, 15 new jobs matching your profile search in Delhi NCR"),
    ("Jira Software", "jira@atlassian.net", "[Jira] (PROJ-243) Fix login authentication flow latency bug"),
    ("AWS Billing", "no-reply@amazon.com", "AWS Monthly Invoice Summary - Account 124534 - Amount due: USD 0.00"),
    ("Spotify Premium", "music@spotify.com", "Your June Premium Receipt - Enjoy ad-free offline music playback"),
    ("Zomato Orders", "receipt@zomato.com", "Your order from Third Wave Coffee has been delivered. Rate your delivery partner."),
    ("Netflix Updates", "info@netflix.com", "New Releases this weekend: Stranger Things Season 5 and more."),
    ("Slack Notification", "notification@slack.com", "[Slack] You have unread messages in 2 channels: #general, #alerts"),
    ("StackOverflow", "community@stackoverflow.com", "Weekly newsletter: Top answered questions about Python 3.12 and React Router v6")
]

for i in range(92):
    subj_template, sender_template, snippet_template = SPAM_SUBJECTS[i % len(SPAM_SUBJECTS)]
    email_id = f"spam_{i}"
    date_offset = datetime.date(2026, 6, 15) - datetime.timedelta(days=(i % 30))
    time_str = f"{date_offset.isoformat()}T12:00:00Z"
    
    NON_TRAVEL_EMAILS.append({
        "id": email_id,
        "subject": f"{subj_template} #{i+1000}",
        "sender": sender_template,
        "date": time_str,
        "snippet": f"{snippet_template}. Log ID {i+99214}.",
        "body": f"<html><body><p>Hello Vasu,</p><p>{snippet_template}</p><p>This is a periodic system newsletter. Click here to unsubscribe.</p></body></html>"
    })

ALL_MOCK_EMAILS = TRAVEL_EMAILS + NON_TRAVEL_EMAILS
