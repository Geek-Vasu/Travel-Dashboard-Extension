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

- **📬 Automated Inbox Scanner**: Scans user inboxes using optimized Google API queries. Decodes MIME structures, strips HTML, and parses structured payloads.
- **📅 Dynamic Trip Grouping**: A geographical grouping engine that maps bookings (flights, lodging, cabs, trains) to trips using a **5-day sliding window constraint** (automatically expanding boundaries as new bookings are matched).
- **🛤️ Chronological Timeline Generator**: Synthesizes check-ins, check-outs, departures, arrivals, and transfers into a single, sorted chronological board.
- **💡 Actionable Insights Warnings**: Evaluates deterministic travel checks, flagging zero-cost bookings, missing return trips, and hotel checkout vs. flight departure conflicts.
- **📊 Spend Analytics**: Integrated `reCharts` visualizations tracking categories (Flights, Hotels, Cabs, Trains) and monthly spending trends.
- **👤 Dynamic User Profile**: Queries the custom `/api/user/me` endpoint to display authentic user information (e.g. name, profile picture fallback, and email) on the console sidebar.
- **🧪 Offline Demo Mode**: Fully functional offline/simulation sandbox that processes mock emails if Gmail API keys are unconfigured.

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
