# GUNI-BUS 2026 – Driver App: Project Context

> **Purpose of this document:** Provide a complete, structured reference for understanding the GUNI-BUS Driver mobile application — its system context, user flow, API contracts, business rules, and UX requirements. Intended for AI-assisted UI design, code generation, and onboarding.

---

## 1. System Overview

| Item | Value |
|---|---|
| **System Name** | GUNI-BUS 2026 – University Bus Management System |
| **University** | Ganpat University (GUNI), Gujarat, India |
| **Backend** | Node.js + Express, deployed on Render |
| **Database** | MongoDB Atlas |
| **Web App** | React (Vite) — for students and admin |
| **Mobile App** | React Native (Expo) — for bus drivers only |
| **API Base URL** | `https://guni-bus-2026.onrender.com/api` |
| **Time Zone** | Asia/Kolkata (IST, UTC+5:30) |

### System Actors

| Actor | Platform | Role |
|---|---|---|
| **Student** | Web / Mobile | Books bus passes, scans QR codes |
| **Driver** | Mobile (Expo) | Manages daily trips, scans student QR codes |
| **Admin** | Web (React) | Manages routes, passes, analytics |

---

## 2. Driver App Purpose

The driver app is a **dedicated, minimal mobile tool** used exclusively by bus drivers during their daily shift. Its sole responsibilities are:

1. **Authenticate** the driver using employee credentials
2. **Track trip milestones** (shift start → university → return → home) via odometer readings
3. **Scan student QR codes** to mark attendance and verify pass validity
4. **Display real-time trip statistics** (students boarded, phase status)

The app does **not** handle ticket booking, payments, complaints, or any admin functionality. It is laser-focused on the physical bus trip workflow.

---

## 3. User Flow (Step-by-Step)

### Phase 0 — Login

```
Driver opens app
  → Enters employeeId + password on Login screen
  → POST /api/auth/login
  → JWT token stored in device (AsyncStorage)
  → Redirected to Dashboard
```

**Key fields:** `loginId` (= employeeId), `password`  
**Response includes:** driver name, assigned route, assigned bus, shift type

---

### Phase 1 — Dashboard (not_started)

```
Driver sees Dashboard
  → Current Phase card shows "Not Started ⏳"
  → "Scan QR" button is DISABLED (greyed out)
  → "Start Shift" button is ENABLED
```

Driver taps **Start Shift**:
- Odometer modal appears
- Driver enters current KM reading
- `POST /api/checkpoints/start-shift` with `{ odometerReading }`
- Phase transitions: `not_started → boarding`

---

### Phase 2 — Boarding (Scanning: Morning/Afternoon)

```
Phase = "boarding" 🟢
  → "Scan QR" button is ACTIVE
  → Driver opens scanner screen
  → Points camera at student QR code
  → POST /api/driver/scan { qrData, [mockTime?] }
  → Result shown: student name, photo, shift, enrollment, scan count
  → Driver scans all students getting on the bus
```

When bus reaches university, driver taps **Reached University**:
- Enters current odometer reading
- `POST /api/checkpoints/reached-university` with `{ odometerReading }`
- Phase transitions: `boarding → at_university`
- **Scanning DISABLED** during this phase

---

### Phase 3 — At University (Scanning Disabled)

```
Phase = "At University 🏫"
  → Scanning is DISABLED
  → Driver waits at university
  → "Start Return" button is ENABLED
```

Driver taps **Start Return**:
- Enters current odometer reading
- `POST /api/checkpoints/start-return` with `{ odometerReading }`
- Phase transitions: `at_university → returning`
- **Scanning RE-ENABLED** for return trip

---

### Phase 4 — Returning (Scanning: Return Direction)

```
Phase = "Returning 🔵"
  → "Scan QR" button is ACTIVE again
  → Driver scans students heading home
  → Same scan screen and API as boarding
  → Backend auto-detects this is a "return" scan based on time + scan count
```

When bus reaches home area, driver taps **Reached Home**:
- Enters final odometer reading
- `POST /api/checkpoints/reached-home` with `{ odometerReading }`
- Phase transitions: `returning → completed`
- Trip ends, total KM calculated

---

### Phase 5 — Completed

```
Phase = "Completed ✅"
  → All buttons disabled
  → Scan button disabled
  → Driver's work for the day is done
```

---

## 4. API Integration Details

### Base URL
```
https://guni-bus-2026.onrender.com/api
```
All requests require `Authorization: Bearer <JWT>` header (except login).

---

### Authentication

#### `POST /api/auth/login`

**Request:**
```json
{
  "loginId": "EMP123",
  "password": "yourpassword"
}
```

**Response:**
```json
{
  "token": "<JWT>",
  "user": {
    "_id": "...",
    "name": "Driver Name",
    "employeeId": "EMP123",
    "role": "driver",
    "shift": "morning",
    "assignedRoute": { "routeName": "Mehsana - GUNI" },
    "assignedBus": { "busNumber": "GJ-01-AB-1234" }
  }
}
```

---

### Driver Dashboard

#### `GET /api/driver/dashboard`

Returns current driver info, today's route analytics, and passenger list.

**Response fields:**
- `driver` — name, employeeId, assignedRoute, assignedBus
- `analytics` — checkedIn, totalPassengers, revenue
- `passengers` — array of today's attendance records

---

### Driver Route Details

#### `GET /api/driver/route-details`

Returns full details of the driver's assigned route.

---

### Checkpoint Lifecycle

All checkpoint endpoints require `{ odometerReading: number }` in body.  
Odometer reading must always be **strictly greater** than the previous reading.

| Endpoint | Trigger | Phase Before | Phase After |
|---|---|---|---|
| `POST /api/checkpoints/start-shift` | Driver starts day | `not_started` | `boarding` |
| `POST /api/checkpoints/reached-university` | Bus arrives at GUNI | `boarding` | `at_university` |
| `POST /api/checkpoints/start-return` | Bus leaves GUNI | `at_university` | `returning` |
| `POST /api/checkpoints/reached-home` | Bus returns to start area | `returning` | `completed` |

#### `GET /api/checkpoints/status`

**Response:**
```json
{
  "exists": true,
  "currentPhase": "boarding",
  "studentCount": 14,
  "canScan": true,
  "checkpoint": { ... }
}
```

---

### QR Scan

#### `POST /api/driver/scan`

**Request:**
```json
{
  "qrData": "GUNI|passId|userId|validUntil|signature",
  "mockTime": "2026-03-17T08:00:00.000Z"
}
```
> `mockTime` is **DEV ONLY** — omit in production. Backend ignores it when `NODE_ENV=production`.

**Success Response:**
```json
{
  "success": true,
  "type": "pass",
  "message": "Boarding Verified",
  "student": {
    "name": "Riya Patel",
    "enrollment": "22CS123",
    "photo": "https://...",
    "dob": "2003-05-12T00:00:00.000Z",
    "mobile": "9876543210"
  },
  "route": "Mehsana - GUNI",
  "shift": "morning",
  "scanPhase": "boarding",
  "scanCount": 1,
  "maxScans": 2
}
```

**Error Response (examples):**
```json
{ "message": "Please start your shift first", "action": "start_shift" }
{ "message": "Scanning disabled. Start return trip to enable scanning", "action": "start_return" }
{ "message": "Daily limit reached (2 scans completed)", "scanCount": 2, "maxScans": 2 }
{ "message": "Shift Mismatch. Student is afternoon, Bus is morning" }
{ "message": "Wrong Route" }
{ "message": "Already scanned for boarding" }
```

---

## 5. Data Flow Diagram

```
Driver App (React Native)
       │
       │  JWT in header
       ▼
  ┌─────────────────────────────────────────────┐
  │        Express REST API (Render)            │
  │                                             │
  │  /api/auth/login          → Auth            │
  │  /api/driver/dashboard    → Driver Info     │
  │  /api/driver/route-details→ Route Info      │
  │  /api/driver/scan         → QR Processing   │
  │  /api/checkpoints/status  → Phase State     │
  │  /api/checkpoints/*       → Phase Updates   │
  └──────────────┬──────────────────────────────┘
                 │
                 ▼
         MongoDB Atlas
  ┌─────────────────────────────────┐
  │  Collections                    │
  │  ─────────────────────────────  │
  │  User           (driver record) │
  │  Route          (assigned route)│
  │  Bus            (assigned bus)  │
  │  TripCheckpoint (phase/odometer)│
  │  BusPass        (student passes)│
  │  DayTicket      (guest tickets) │
  │  DailyAttendance(scan records)  │
  │  StudentJourneyLog (full journey)│
  │  RouteAnalytics (daily stats)   │
  └─────────────────────────────────┘
```

### State held on device
- JWT token (AsyncStorage)
- Cached user data (name, shift, route, bus)

All phase and attendance state is **server-side** — the app polls on focus/refresh.

---

## 6. Business Rules & Constraints

### 6.1 Shift Types

| Shift | Description |
|---|---|
| `morning` | Students leave home in the morning, return in the afternoon |
| `afternoon` | Students leave home at midday, return in the evening |

### 6.2 Time Windows for Scanning

The backend **automatically** determines whether a scan is for boarding or return based on the current time and how many scans the student has had today.

| Shift | Phase | Allowed Time |
|---|---|---|
| Morning | Boarding | Before 8:30 AM |
| Morning | Return | After 2:10 PM |
| Afternoon | Boarding | Before 11:40 AM |
| Afternoon | Return | After 5:10 PM |

Scans **outside** these windows are rejected by the backend.

### 6.3 Scan Count Rules

- Each student gets a **maximum of 2 scans per day** (1 boarding + 1 return).
- A Day Ticket with `ticketType: "single"` allows only **1 scan** (boarding only).
- Attempting a 3rd scan returns: `Daily limit reached (2 scans completed)`.
- A duplicate scan in the same phase returns: `Already scanned for boarding/return`.

### 6.4 Route & Shift Authorization

- A driver can **only scan QR codes for their own assigned route**.
- A student's pass shift must **match the driver's bus shift**.
- Mismatches are rejected with clear error messages.

### 6.5 Checkpoint Phase Gate

| Phase | Can Scan? |
|---|---|
| `not_started` | ❌ No |
| `boarding` | ✅ Yes |
| `at_university` | ❌ No |
| `returning` | ✅ Yes |
| `completed` | ❌ No |

### 6.6 Odometer Rules

- Odometer readings must always increase with each checkpoint.
- Backend validates this and rejects invalid decreasing values.

### 6.7 QR Data Format

QR codes contain a signed string in the format:
```
GUNI|<passId>|<userId>|<validUntil>|<signature>
```
The app must pass this **raw and unmodified** to the scan API.

---

## 7. Current App Screen Inventory

| Screen | File | Purpose |
|---|---|---|
| Login | `DriverLoginScreen.jsx` | Employee ID + password login |
| Dashboard | `DriverDashboardScreen.jsx` | Phase status, actions, statistics |
| Scan QR | `ScanQRCodeScreen.jsx` | Live camera QR scanner + result display |
| Route Details | `RouteDetailsScreen.jsx` | View assigned route stop info |

### Navigation Flow
```
DriverLogin
    └── DriverDashboard
            ├── ScanQRCode (modal/stack)
            └── RouteDetails (stack)
```

---

## 8. UX Guidelines for Design AI

### 8.1 Target User Profile

- Bus drivers at a university
- **Non-technical users**, often older adults
- Operating a phone while managing a bus
- Under **time pressure** during boarding/return windows
- May have limited English literacy

### 8.2 Core UX Principles

| Principle | Implementation |
|---|---|
| **Large touch targets** | All primary action buttons ≥ 56px tall |
| **One action per screen** | Each screen has one clear primary action |
| **Instant visual feedback** | Phase status always visible at top of dashboard |
| **Error clarity** | Errors show in plain language (no tech jargon) |
| **Minimal text** | Icons + short labels over paragraphs |
| **No decision fatigue** | Disabled buttons for invalid actions (not hidden) |

### 8.3 Phase Status Card

Should be the **most prominent element** on the Dashboard. Shows:
- Icon (emoji) — `⏳ 🟢 🏫 🔵 ✅`
- Phase label — `Not Started / Boarding / At University / Returning / Completed`
- Color-coded border matching phase
- Live student count (when boarding/returning)

### 8.4 Scan QR Button

- Must be **primary/hero CTA** on the dashboard
- Full-width, large, brightly colored when active
- Greyed out with clear explanation when inactive
- Tapping opens camera immediately — no extra steps

### 8.5 Action Buttons (Checkpoint Controls)

- 4 checkpoint buttons displayed as a **2×2 or 1×4 grid** below scan button
- Plus 1 "Route Info" button
- Greyed out / opacity 35% when disabled (not hidden)
- Each shows icon + short label

### 8.6 Scan Result Screen

After a successful or failed scan, show:
- **Full-screen result card** — success (green) or error (red)
- Student photo (if available)
- Student name (large text)
- Enrollment number
- Pass type + shift badge
- Boarding/Return label
- Scan count `1/2` or `2/2`
- "Scan Another Student" CTA button (prominent)
- "Back to Dashboard" secondary link

### 8.7 Odometer Modal

- Bottom sheet style modal
- Single large autofocused numeric input
- Confirm + Cancel buttons

### 8.8 Color Palette (existing)

| Token | Usage |
|---|---|
| `COLORS.primary` | Blue — main action color, scan button |
| `COLORS.success` | Green — boarding phase, success scans |
| `COLORS.warning` | Amber — at university phase |
| `COLORS.danger` | Red — errors, rejected scans |
| `COLORS.background` | Dark background |
| `COLORS.surface` | Card/panel background |
| `COLORS.text` | Primary text |
| `COLORS.textSecondary` | Labels, hints, secondary info |

### 8.9 Typography

- Driver name on dashboard: `fontSize 20, fontWeight 700`
- Phase value: `fontSize 20, fontWeight 700`
- Stat numbers: `fontSize 18, fontWeight 700`
- Action labels: `fontSize 12, fontWeight 600`
- Avoid serif fonts — use system sans-serif or Inter

### 8.10 Accessibility

- All interactive elements should have `accessibilityLabel` props
- `testID` props on primary buttons for testing
- Error states should be announced clearly

---

## 9. Development Notes

### Mock Time (DEV ONLY)
- The backend's `timeProvider.js` reads `req.body.mockTime` to allow time simulation in development.
- The Scan screen contains a collapsible "🧪 DEV ONLY – Mock Scan Time" panel.
- When the toggle is ON + a valid datetime is entered, the ISO string is sent as `mockTime` in the scan payload.
- In `NODE_ENV=production`, the server **ignores** `mockTime` entirely.

### Auth Storage
- JWT stored via `AsyncStorage` (key: `"token"`)
- User data cached via `AsyncStorage` (key: `"userData"`)
- AuthContext manages the in-memory `user` state with immediate logout

### API Axios Instance
- Base URL configured in `src/services/api.js`
- JWT auto-attached via request interceptor
- 401 responses trigger automatic logout

---

*Last updated: 2026-03-17 | Driver App version: feature/driver-app*
