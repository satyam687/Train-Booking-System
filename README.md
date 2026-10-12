# RailBook AI — Smart Train Booking System

A production-style full-stack railway reservation platform built with **React 19 (Vite + Tailwind CSS)**, **Django REST Framework**, **SQLite3**, and **Machine Learning** for intelligent train recommendations and demand forecasting.

---

## 🌟 Key Capabilities

1. **Intelligent Train Recommendations**: Multi-attribute decision utility engine scoring trains based on fares, journey duration, departure preferences, and seat availability, providing human-understandable rationales.
2. **Ticket Demand & Waitlist Prediction**: Supervised **RandomForestRegressor** pipeline persisted using `joblib` that estimates seat booking pressure, surge factors, and waitlist risk for upcoming dates.
3. **Safe Transactional Booking & Inventory Protection**: Atomic database transactions (`transaction.atomic`) with optimistic concurrency locks preventing overbooking on SQLite.
4. **Real-Time Train Status Provider Adapter**: Pluggable provider architecture with caching, data freshness indicators, mock fallbacks, and live status logs.
5. **High-Fidelity Printable E-Tickets (ERS)**: Digital reservation slips with QR code validation, allocated coach/seat numbers, and passenger rosters.
6. **Integrated Analytics & Recharts Dashboards**: 14-day demand forecast curves, revenue trends, class distribution, and payment breakdowns.
7. **Role-Based JWT Authentication**: Access and refresh tokens with Passenger and Administrator access control.

---

## 🏗️ Technology Architecture

### Frontend
- **Framework**: React 19 with Vite 6
- **Styling**: Tailwind CSS v4 (Navy Blue `#0f2444`, Crisp White, and Orange `#f97316` accents)
- **Routing**: React Router 6
- **State & HTTP**: Context API + Axios with automatic JWT interceptors
- **Visualizations**: Recharts (Area charts, Bar charts, Line charts)
- **Icons**: Lucide React

### Backend
- **Framework**: Python 3.13 + Django 6.1 + Django REST Framework
- **Authentication**: `djangorestframework-simplejwt` (JWT access & refresh tokens)
- **Documentation**: `drf-spectacular` (OpenAPI 3.0 & Swagger UI)
- **CORS & Filters**: `django-cors-headers`, `django-filter`
- **Database**: SQLite3 (`backend/db.sqlite3`)

### Machine Learning Engine
- **Models**: `RandomForestRegressor` ensemble pipeline
- **Feature Pipeline**: Route hashes, class encodings, day of week, advance reservation days, holiday flags
- **Persistence**: `joblib` binary artifacts saved in `backend/ml/artifacts/`
- **Evaluation**: Mean Absolute Error (MAE), Root Mean Squared Error (RMSE), and $R^2$ scores

---

## 🚀 Step-by-Step Windows PowerShell Setup

Follow these exact commands in **Windows PowerShell** to setup, seed, and run the project:

### Terminal 1: Backend Setup & Server

```powershell
# 1. Navigate to project root
cd G:\Booking

# 2. Create and activate Python virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Note: If PowerShell execution policy restricts scripts, you can run:
# Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
# or invoke Python directly via .\venv\Scripts\python.exe

# 3. Install backend dependencies
.\venv\Scripts\pip.exe install -r backend\requirements.txt

# 4. Copy sample environment variables
Copy-Item backend\.env.example backend\.env

# 5. Apply database migrations
.\venv\Scripts\python.exe backend\manage.py migrate

# 6. Seed comprehensive railway demo data (26 stations, 32 trains, schedules, inventories, demo users)
.\venv\Scripts\python.exe backend\manage.py seed_data

# 7. Train the Machine Learning Demand Model
.\venv\Scripts\python.exe backend\manage.py train_demand_model

# 8. Run unit & integration test suite (22 tests)
.\venv\Scripts\python.exe backend\manage.py test tests

# 9. Start the Django REST backend server on port 8000
.\venv\Scripts\python.exe backend\manage.py runserver 127.0.0.1:8000
```

### Terminal 2: Frontend Setup & Dev Server

```powershell
# 1. Navigate to frontend folder
cd G:\Booking\frontend

# 2. Install Node dependencies (using npm.cmd on Windows)
npm.cmd install --legacy-peer-deps

# 3. Start the Vite React development server
npm.cmd run dev -- --host 127.0.0.1
```

Once started:
- **Frontend Web Application**: [http://127.0.0.1:5173/](http://127.0.0.1:5173/)
- **Swagger API Documentation**: [http://127.0.0.1:8000/api/docs/](http://127.0.0.1:8000/api/docs/)
- **Redoc API Documentation**: [http://127.0.0.1:8000/api/redoc/](http://127.0.0.1:8000/api/redoc/)
- **Django Admin Portal**: [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/)

---

## 🔑 Default Demonstration Accounts

The database seed command generates verified demo accounts with quick 1-click login on the login page:

| Role | Username | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Passenger** | `passenger` | `pass123` | Search, Bookings, E-Tickets, Profile, Cancellation |
| **Administrator** | `admin` | `admin123` | Operational Hub, Global Bookings, System Analytics |

---

## 🗺️ REST API Endpoints Overview

### Authentication & Users
- `POST /api/auth/register/` — Register new passenger
- `POST /api/auth/login/` — Authenticate and receive JWT access & refresh tokens
- `POST /api/auth/token/refresh/` — Rotate JWT access token
- `GET /api/auth/profile/` — Retrieve user profile
- `PUT /api/auth/profile/` — Update user profile contact information
- `POST /api/auth/change-password/` — Change user account password

### Stations & Trains
- `GET /api/stations/` — Search stations by code, name, city, state
- `GET /api/trains/` — List active trains with classes and stations
- `GET /api/trains/search/` — Multi-filter search (source, dest, date, class, price, duration, availability, sort)
- `GET /api/trains/{id}/` — Train details, schedules, and intermediate halts
- `GET /api/trains/{id}/status/` — Real-time running status, delays, and provider data
- `GET /api/trains/availability/` — Direct seat availability check

### Bookings & Payments
- `POST /api/bookings/` — Safe transactional seat reservation & unique reference generation
- `GET /api/bookings/` — List user's bookings (admin views all)
- `GET /api/bookings/{reference}/` — Detailed booking breakdown with passenger seat roster
- `POST /api/bookings/{reference}/cancel/` — Cancel booking and restore seat inventory atomically
- `POST /api/payments/demo/` — Safe sandbox demo payment confirmation
- `GET /api/payments/{reference}/` — Payment receipt and transaction reference

### Machine Learning & Dashboard
- `POST /api/ml/demand-prediction/` — Predict seat demand % and waitlist probability
- `POST /api/ml/recommendations/` — Multi-attribute AI train recommendations with scores
- `GET /api/ml/model-info/` — Model architecture, evaluation metrics (MAE, R²), and dataset provenance
- `GET /api/ml/fare-insights/` — 14-day projected demand curve and dynamic fare fluctuations
- `GET /api/dashboard/summary/` — System revenue, confirmed bookings, and active trains
- `GET /api/dashboard/booking-analytics/` — 7-day bookings and revenue charts data
- `GET /api/dashboard/demand-analytics/` — Route density analytics and high-risk trains

---

## 🤖 Machine Learning Pipeline Details

### Demand Prediction (`RandomForestRegressor`)
- **Features Used**: Train number hash, Route sector, Travel Class, Day of week, Weekend indicator, Month, Holiday flag, Days to departure.
- **Trained Artifacts**:
  - `backend/ml/artifacts/demand_model.joblib`: Serialized ensemble pipeline.
  - `backend/ml/artifacts/model_metrics.json`: Stored evaluation metrics ($MAE \approx 5.52\%$, $R^2 \approx 0.795$).
- **Disclosures**: Uses a reproducible synthetic training set modeled on Indian Railway traffic patterns for development and testing.

### Recommendation Algorithm
- Uses multi-attribute utility theory:
  $$\text{Score} = w_f \cdot \text{FareScore} + w_d \cdot \text{SpeedScore} + w_a \cdot \text{AvailScore} + w_t \cdot \text{TimingScore}$$
- Generates dynamic badges (*Top AI Pick*, *Lowest Fare on Route*, *Fastest Journey*).

---

## 🛡️ Reliability & Concurrency Notes (SQLite3)

- **Atomic Reservations**: Seat inventory decrements and booking creation are wrapped in `transaction.atomic()` blocks.
- **Optimistic Concurrency**: `SeatInventory` incorporates a `version` field and server-side seat verification before decrementing.
- **Restoration on Cancellation**: Cancelling a booking increments `available_seats` safely within an atomic transaction.

---

## 📋 Feature Checklist

| Requirement | Status | Notes |
| :--- | :--- | :--- |
| **User Authentication** | ✅ Implemented | JWT tokens, password hashing, role permissions |
| **Train Search & Discovery** | ✅ Implemented | 26 stations, 32 trains, route filters, sorting |
| **Seat Inventory Models** | ✅ Implemented | Station, Train, TrainClass, TrainSchedule, SeatInventory |
| **Atomic Booking Flow** | ✅ Implemented | Safe transactions, no frontend trust, unique booking refs |
| **Demo Payment Flow** | ✅ Implemented | UPI, Card, Net Banking simulation sandbox |
| **Printable E-Ticket** | ✅ Implemented | Indian Railway ERS design with QR validation |
| **Booking Cancellation** | ✅ Implemented | Atomically restores seats to inventory |
| **Provider Adapter Pattern** | ✅ Implemented | Mock/Real provider abstraction with caching & freshness |
| **ML Demand Model** | ✅ Implemented | RandomForestRegressor persisted via joblib |
| **ML Recommendations** | ✅ Implemented | Transparent multi-criteria scoring with badges |
| **Fare Insights & Curves** | ✅ Implemented | 14-day projection rendered with Recharts |
| **18 Frontend Pages** | ✅ Implemented | Complete React 19 pages with navy/orange aesthetic |
| **Automated Test Suite** | ✅ Implemented | 22 tests passing with 0 errors |
