# Swim School Scheduler

A full-stack scheduling application for swim schools. React + TypeScript frontend served from a Python (FastAPI) backend with SQLite storage and AES-256-GCM field-level encryption.

## Features

- **Instructor Management** -- Add and list swim instructors
- **Client Management** -- Add and list clients with name, email, and phone
- **Appointment Scheduling** -- 20-minute block-based scheduling with double-booking prevention
- **Recurring Appointments** -- Generate weekly recurring lesson series
- **Dashboard** -- Live counts for instructors, appointments, and clients
- **Field-Level Encryption** -- Sensitive PII (names, email, phone) encrypted at rest using AES-GCM with ECC key wrapping
- **Single Server** -- One command starts both the API and the frontend UI

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript 5.8 + Tailwind CSS 3.4 |
| Build | Vite 7 |
| Backend | Python 3.10+ / FastAPI / SQLAlchemy / SQLite |
| Encryption | AES-256-GCM with ECC P-256 key wrapping |
| Testing | Vitest + React Testing Library (frontend), Pytest (backend) |

## Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- Python 3.10+

### Install

```bash
git clone https://github.com/your-username/swim-school-scheduler.git
cd swim-school-scheduler

# Frontend dependencies
npm install

# Backend dependencies
cd backend
pip install -r requirements.txt
```

### Run

```bash
cd backend
python run.py          # builds frontend, starts server at http://127.0.0.1:8000
python run.py --skip-build   # start without rebuilding frontend
python run.py --port 3000    # use a different port
```

Open **http://127.0.0.1:8000** in your browser -- that's it, one URL.

### Development (hot reload)

For frontend development with hot reload, run the backend and Vite dev server side-by-side:

```bash
# Terminal 1 -- backend API
cd backend
python run.py --skip-build

# Terminal 2 -- Vite dev server (proxies /api to backend)
npm run dev
```

The Vite dev server at `http://localhost:5173` automatically proxies `/api/*` requests to the backend.

## Testing

```bash
# Frontend (152 tests)
npm test               # watch mode
npx vitest run         # single run
npx vitest run --coverage

# Backend (50 tests)
cd backend
python -m pytest tests/ -v
```

## Project Structure

```
swim-school-scheduler/
├── src/                      # React frontend
│   ├── components/           # UI components + tests
│   ├── lib/
│   │   ├── api.ts            # HTTP client (relative URLs)
│   │   └── firestore.ts      # Data access layer (calls api.ts)
│   ├── types/index.ts        # TypeScript interfaces
│   ├── utils/timeSlots.ts    # Time slot logic + conflict detection
│   └── App.tsx               # Root component
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app + static file serving
│   │   ├── database.py       # SQLAlchemy + SQLite
│   │   ├── models.py         # ORM models (encrypted fields)
│   │   ├── crypto.py         # AES-GCM encryption + ECC key wrapping
│   │   ├── schemas.py        # Pydantic request/response models
│   │   └── routes/           # API endpoints
│   ├── tests/                # Pytest test suite
│   ├── run.py                # Entry point (build + serve)
│   └── requirements.txt      # Python dependencies
├── vite.config.ts            # Builds to backend/static, proxies /api in dev
└── package.json
```

## Architecture

### Single-Server Design

```
Browser  ─────►  FastAPI (port 8000)
                   ├── /api/*        → REST endpoints (JSON)
                   └── /*            → React SPA (static files)
```

The Vite build outputs to `backend/static/`. FastAPI serves those files for any non-API route, with `index.html` as the SPA fallback.

### Scheduling Model

- 1 block = 20 minutes, 2 blocks = 40 minutes, 3 blocks = 60 minutes
- Blocks start at :00, :20, or :40 of each hour
- Operating hours: 8:00 AM -- 8:00 PM
- Back-to-back appointments allowed; same-block double-booking prevented

### Encryption

Sensitive fields (names, email, phone) are encrypted at rest in SQLite:

1. An ECC P-256 key pair wraps a symmetric Data Encryption Key (DEK)
2. Each field value is encrypted with AES-256-GCM using a random nonce
3. Keys are generated automatically on first run

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/instructors` | Create instructor |
| GET | `/api/instructors` | List instructors |
| DELETE | `/api/instructors/{id}` | Delete instructor |
| POST | `/api/clients` | Create client |
| GET | `/api/clients` | List clients |
| DELETE | `/api/clients/{id}` | Delete client |
| POST | `/api/appointments` | Create appointment |
| GET | `/api/appointments?date=YYYY-MM-DD` | List appointments |
| PATCH | `/api/appointments/{id}/cancel` | Cancel appointment |
| POST | `/api/appointments/recurring` | Create recurring series |

## License

Private project -- not for redistribution.
