# ✈️ Travelista: Travel Dashboard Organizer (MVP)

Travelista is a premium, consumer-first travel intelligence portal that automatically organizes travel confirmation emails into clean, unified, chronological itineraries. 

By sandboxing access via Google OAuth, clean-stripping raw HTML payloads, and employing dual-engine AI and heuristic extraction, Travelista turns the chaos of fragmented confirmation emails into a structured dashboard featuring visual timelines, spend analytics, and proactive travel warnings.

---

## 🎨 Design Philosophy & UI Redesign
The interface has been completely overhauled to transition from a harsh digital-brutalist panel to a **soft, modern consumer startup aesthetic** (inspired by Notion, Linear, Airbnb, and Apple Wallet):
- **Collapsible Navigation**: A responsive, animated left sidebar (`framer-motion`) that collapses to save screen estate.
- **Visual Clarity**: Rounding system standard at `16px` (`rounded-2xl`), soft border tracks (`#E2E8F0`), and premium micro-shadows.
- **No Stock Imagery**: Designed cleanly around data, layout hierarchy, custom SVGs, and dynamic typography rather than placeholder banners.
- **Cohesive Travel Palette**: Built over HSL-tailored slate backgrounds (`#F8FAFC`), pure white surfaces, and deep Indigo accents (`#2563EB`).

---
## 🚀 Key Features

- **📬 Automated Inbox Scanner**: Securely scans the user's Gmail inbox using Google OAuth and optimized Gmail API queries. Decodes MIME messages, strips HTML content, and extracts travel-related information from booking confirmations.

- **🤖 AI-Powered Travel Extraction**: Uses OpenAI to intelligently classify travel emails and extract structured booking information for flights, hotels, trains, and cabs, with heuristic fallbacks to ensure reliability.

- **📅 Dynamic Trip Grouping**: Automatically groups related bookings into unified trips using destination matching and a **5-day sliding window**, continuously updating trip boundaries as new bookings arrive.

- **🛤️ Interactive Timeline Generator**: Combines flights, hotel stays, train journeys, and ground transportation into a single chronological timeline, providing a complete view of the user's itinerary.

- **📆 Google Calendar Integration**: Synchronizes trips with Google Calendar by automatically creating events for flights, hotel check-ins/check-outs, train journeys, and cab pickups, ensuring travel plans seamlessly integrate with the user's schedule.

- **🎒 Intelligent Packing Assistant**: Generates personalized packing checklists using trip details such as destination, weather, duration, and travel type. Users can track packing progress, add custom items, and manage their checklist directly from the dashboard.

- **💬 AI Travel Chatbot**: A context-aware conversational assistant that answers questions about trips, bookings, timelines, expenses, and packing lists using the application's structured travel data instead of raw emails.

- **💡 AI Travel Insights**: Evaluates travel itineraries to generate proactive recommendations and warnings, such as missing return journeys, pending payments, hotel check-out conflicts, and other actionable travel reminders.

- **📊 Spend Analytics**: Interactive Recharts dashboards visualize travel expenses across flights, hotels, trains, and cabs while providing trip-wise and category-wise spending insights.

- **👤 Dynamic User Profile**: Retrieves authenticated user information through the `/api/user/me` endpoint and displays profile details, email address, and account information throughout the application.

- **🔄 Continuous Inbox Synchronization**: Automatically detects newly received travel confirmations and updates existing trips without requiring manual re-scanning, ensuring itineraries remain current.

- **🧪 Offline Demo Mode**: Provides a fully functional simulation environment using mock travel emails, allowing the complete application to be explored without configuring Gmail OAuth or OpenAI credentials.

---

## 🛠️ Technology Stack

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS v4, Framer Motion, Recharts, Lucide Icons | Renders responsive pages, charts, modals, and navigation routes. |
| **Backend** | FastAPI, Python 3.10+, SQLAlchemy ORM | Exposes API routes, handles Google OAuth callbacks, and executes async background scanning workers. |
| **Database** | SQLite / PostgreSQL | Maintains relations across Users, Trips, Bookings, Timelines, and Insights. |
| **Integrations**| Gmail API (readonly), OpenAI API (`gpt-4o-mini`) | Integrates secure mailbox scanning and structured entity extraction. |

---

## 📂 Codebase Directory Layout

```
travel/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── services/
│   │   │   ├── email_provider.py   # Gmail API & Mock Provider
│   │   │   ├── email_cleaner.py    # HTML text stripping & footer filtering
│   │   │   ├── extractor.py        # OpenAI & Heuristic extraction
│   │   │   ├── grouping.py         # 5-day sliding window grouping logic
│   │   │   ├── timeline.py         # Chronological event generators
│   │   │   └── insights.py         # Warnings engine & AI summaries
│   │   ├── database.py             # Database engine & Session local
│   │   ├── main.py                 # API routes & endpoint definitions
│   │   ├── models.py               # SQLAlchemy Database Models
│   │   └── schemas.py              # Pydantic schemas & response models
│   └── requirements.txt            # Python dependencies
│
├── frontend/                 # React Single Page App
│   ├── src/
│   │   ├── components/             # Reusable UI Components (Sidebar, BookingCard, SpendCharts)
│   │   ├── pages/                  # Views (Dashboard, EmailScanner, TripDetail, Audit)
│   │   ├── App.jsx                 # Routing wrapper
│   │   └── index.css               # Tailwind v4 import & custom styling
│   └── package.json                # Frontend dependencies
```

---

## ⚙️ Installation & Local Setup

### 1. Prerequisites
- **Node.js** (v18+)
- **Python** (3.10+)

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   # Windows:
   python -m venv venv
   .\venv\Scripts\activate

   # macOS/Linux:
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up your environment variables. Create a `.env` file in the `backend/` directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   DATABASE_URL=sqlite:///./travel_dashboard.db
   ```
   *Note: If `OPENAI_API_KEY` and Google credentials are left blank, the system automatically launches in **Demo Simulator Mode**, running heuristic parsers over local test emails.*

5. Run the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The API server will run at `http://localhost:8000`.

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```
   The UI dashboard will run at `http://localhost:5173`.

---

## 🔍 Validation & Verification Guide

1. Open your browser and navigate to `http://localhost:5173`.
2. Click **Connect Gmail Account** (or click **Launch Simulation Mode** if APIs are unconfigured).
3. The inbox scanner will compile processing states dynamically on the workspace screen.
4. Click **Go to Desk** to redirect to the main Travel Dashboard.
5. In the sidebar, verify that the logged-in profile (email and name) matches your signed-in credentials.
6. Hover over metrics, expand/collapse the sidebar navigation, and click into individual trips to check timelines, insights, and category spends.
7. To run a production check, compile the frontend assets:
   ```bash
   cd frontend
   npm run build
   ```

---

## 🔒 Security & Privacy Audits
- **Data Sandboxing**: The Gmail API scope is restricted exclusively to read-only queries matching travel confirmation keywords.
- **OpenAI Compliance**: Only the cleaned plain text body of travel-relevant emails is sent to OpenAI APIs. User email headers, authentication keys, and signatures are completely stripped beforehand.
- **Local Credentials**: Authorization codes are stored locally on your machine in `backend/token.json` and are refreshed client-side.
