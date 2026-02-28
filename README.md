# GUNI-BUS 2026

GUNI-BUS is a comprehensive full-stack modern transport and logistics system built for university bus tracking, ticketing, and student management. It operates on a robust real-time MERN architecture with payment gateway integrations and complex role-based access control.

## 🏗️ Technology Stack

### Frontend (Client App)
- **Framework:** React 19 via Vite. 
- **Styling:** Tailwind CSS (v3.4)
- **Animations:** Framer Motion
- **Data Fetching:** Axios and React Query
- **Hardware Integration:** `html5-qrcode` library for high-speed QR ticket scanning.
- **Payments:** `react-razorpay` for capturing pass and ticket payments.
- **Real-Time:** `socket.io-client` handling live updates.

### Backend (Server API)
- **Environment:** Node.js + Express (v5.2.1) Server.
- **Database:** MongoDB / Mongoose.
- **Authentication:** JWT (JSON Web Tokens) and `bcryptjs`.
- **Real-Time Engine:** `socket.io` for emitting instantaneous events to the Admin dashboard.
- **Background Jobs:** `node-cron` orchestrates time-bound events, like auto-expiring 30-day "Lost & Found" items.
- **Payment Processing:** Official `razorpay` API SDK.
- **File Handling:** `multer` for base64 file encodings.

---

## 🧩 Core Modules & Architecture

The application dictates control through three strictly isolated User Roles: **Admin**, **Driver**, and **Student**. The Mongoose Database is highly normalized across 14 distinct models.

### 1. Unified Authentication & Profiles
* Handled securely via JWT.
* Contains specific subsets of information based on the role (e.g., Students have an `enrollmentNumber`, Drivers have an `employeeId`).

### 2. Digital Bus Passes & Payments
* Allows students to apply for semester-long or yearly bus passes.
* Tightly integrated with Razorpay where students generate an order on the server and complete the transaction on the frontend.
* Follows an automatic approval path upon verified payment.

### 3. "One-Day" Ticketing Engine
* An entirely separate flow from global passes, allowing casual riders to pre-book a single-day journey.
* Incorporates a separate Payment Flow and a separate validation pipeline when scanning.
* Governed by checking which prevents students from booking tickets on designated holidays or weekends.

### 4. Fleet & Route Management
* Admins are responsible for defining Routes (with specific stops) and tying them to specific Buses.
* Drivers are assigned specifically to these routes and buses, automatically mapping their mobile app environment to the correct physical bus.

### 5. Boarding & Checkpoints
* **Driver View:** A core utility where drivers physically scan either a static Bus Pass QR or a dynamic rotating One-Day Ticket QR.
* The system instantly validates the legitimacy of the pass, checks duplicate scans, and marks attendance.
* Drivers also tap "Checkpoints" along their route, generating exact arrival timings.

### 6. Live Attendance & Advanced Analytics
* This is where **Socket.io** comes alive. Whenever a driver scans a ticket, the backend shoots a socket event to the Admin Dashboard under "Live Attendance," updating graphs and passenger counts in real-time.
* `StudentJourneyLog` and `RouteAnalytics` crunch raw log data to provide graphical load-balancing insights to admins (e.g., figuring out which routes are overcrowded).

### 7. Community Noticeboard (Lost & Found)
* A community-driven feature where students report lost items and drivers/admins report found items.
* Employs advanced **Admin Moderation:** Admins can delete comments, lock chaotic threads, and bypass the driver to instantly report found items from within the depot.
* **Auto-Cleanup:** A CRON job runs at 11:59 PM nightly to archive items inactive for > 30 days.

---

## 📈 Summary of Workflows

1. **The Student Lifecycle:** Signs up -> Applies for a Route -> Pays via Razorpay -> Generates a QR Code on their phone -> Boards Bus and presents phone to Driver.
2. **The Driver Lifecycle:** Logs into the mobile web app -> Receives route assignment -> Actively scans student QRs while they board -> Hits GPS/Route Checkpoints while driving.
3. **The Admin Lifecycle:** Logs into desktop dashboard -> Manages overall fleet health -> Monitors live attendance via websockets -> Moderates the community noticeboard -> Pulls CSV/PDF export reports on daily ridership.

## Getting Started

### Backend
1. `cd server`
2. Configure `.env` (MongoDB URI, Razorpay Keys, JWT Secrets)
3. `npm install`
4. `npm run dev`

### Frontend
1. `cd client`
2. Configure `.env` (Vite API URL, Razorpay Public Key)
3. `npm install`
4. `npm run dev`
