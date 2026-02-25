# Swim School Scheduler

A React + TypeScript scheduling application for swim schools, built with Firebase, Tailwind CSS, and a test-driven development approach.

## Features

- **Instructor Management** -- Add and list swim instructors with form validation
- **Client Management** -- Add and list clients with name, email, and phone fields
- **Appointment Scheduling** -- 20-minute block-based scheduling with double-booking prevention
- **Recurring Appointments** -- Generate weekly recurring lesson series
- **Dashboard** -- Overview of instructors, appointments, and active clients with live counts
- **Error Boundary** -- Graceful error handling with customizable fallback UI
- **Responsive Design** -- Mobile-first layout with Tailwind CSS
- **Demo Mode** -- Runs without Firebase credentials using in-memory mocks

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript 5.8 |
| Build | Vite 7 |
| Backend | Firebase Firestore + Anonymous Auth |
| Styling | Tailwind CSS 3.4 |
| Testing | Vitest + React Testing Library |
| Linting | ESLint + TypeScript ESLint |

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- A Firebase project (optional -- demo mode works without one)

### Installation

```bash
git clone https://github.com/your-username/swim-school-scheduler.git
cd swim-school-scheduler
npm install
```

### Environment Variables

Create a `.env` file for Firebase credentials:

```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_USE_FIRESTORE=true
```

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_FIREBASE_*` | No | Firebase project credentials |
| `VITE_USE_FIRESTORE` | No | Set to `true` to connect to a real Firestore instance. When omitted, the app runs in demo mode with in-memory mocks. |

### Development

```bash
npm run dev        # Start dev server at http://localhost:5173
npm run build      # Production build (TypeScript check + Vite bundle)
npm run preview    # Preview production build locally
npm run lint       # Run ESLint
```

## Testing

```bash
npm test               # Run tests in watch mode
npm run test:run       # Run tests once
npm run test:ui        # Run tests with Vitest UI
npm run test:coverage  # Generate coverage report
```

### Testing approach

The project follows **Test-Driven Development (TDD)**:

1. Tests are written first for each component and utility
2. Implementation follows to make tests pass
3. Firebase operations are mocked in all tests via `src/test/setup.ts`

All test files live alongside their components (`*.test.tsx`). Mocks use `vi.mock` for Firestore functions and `vi.clearAllMocks()` in `beforeEach`.

## Project Structure

```
src/
├── components/
│   ├── AppointmentsTable   # Lesson schedule table
│   ├── ClientForm          # Add client form with name/email/phone validation
│   ├── ClientList          # List of clients from Firestore
│   ├── DashboardLayout     # Admin dashboard shell
│   ├── ErrorBoundary       # React error boundary with fallback UI
│   ├── InstructorForm      # Add instructor form with validation
│   ├── InstructorList      # List of instructors from Firestore
│   ├── Layout              # Main app layout (header + nav + content)
│   ├── LoaderSwimmer       # Animated loading indicator
│   ├── Sidebar             # Collapsible sidebar navigation
│   ├── StatCard            # Statistic display card
│   ├── TopNav              # Top navigation bar
│   └── WaveDivider         # Decorative SVG wave
├── lib/
│   ├── firebase.ts         # Firebase app initialization
│   └── firestore.ts        # Firestore CRUD + browser demo mocks
├── types/
│   └── index.ts            # TypeScript interfaces (Instructor, Client, Appointment)
├── utils/
│   └── timeSlots.ts        # Time slot generation and conflict detection
├── test/
│   └── setup.ts            # Vitest global setup and Firebase mocks
├── App.tsx                 # Root component with section routing + ErrorBoundary
└── main.tsx                # React entry point
```

## Component Reference

| Component | Props | Description |
|-----------|-------|-------------|
| `InstructorForm` | `onSuccess(id, name)`, `onCancel()` | Form to add a new instructor |
| `InstructorList` | -- | Fetches and displays all instructors |
| `ClientForm` | `onSuccess(id, name)`, `onCancel()` | Form to add a new client (name, email, phone) |
| `ClientList` | -- | Fetches and displays all clients |
| `ErrorBoundary` | `fallback?` (ReactNode) | Catches render errors, shows fallback UI |
| `Layout` | `activeSection`, `onSectionChange`, `children` | App shell with sidebar navigation |

## Architecture

### Scheduling Model

Appointments use a **20-minute block system**:
- 1 block = 20 minutes, 2 blocks = 40 minutes, 3 blocks = 60 minutes
- Blocks start at :00, :20, or :40 of each hour
- Operating hours: 8:00 AM -- 8:00 PM
- Back-to-back appointments are allowed; double-booking the same block is prevented

### Data Flow

1. Components call functions from `src/lib/firestore.ts`
2. Firestore functions validate input, check for conflicts, and write to Firestore
3. Components manage loading/error/success states via React hooks
4. When `VITE_USE_FIRESTORE` is not `true`, browser-side mocks provide demo data

### Type System

All data structures are defined in `src/types/index.ts`:
- `Instructor` -- id, name, createdAt
- `Client` -- id, name, email, phone, createdAt
- `Appointment` -- id, instructorId, clientId, date, startTime, endTime, type, blocks, status, createdAt

## Business Rules

- Instructor names must be at least 2 characters
- Client names and emails are required; email must be valid format
- Appointments cannot be scheduled in the past
- Appointments must be within business hours (8 AM -- 8 PM)
- Maximum 2 months advance booking
- Double-booking prevention via block-level conflict detection

## License

Private project -- not for redistribution.
