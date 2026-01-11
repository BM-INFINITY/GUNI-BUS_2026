# University Bus Transportation System - Complete Project Documentation

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Frontend Pages](#frontend-pages)
6. [Setup & Installation](#setup--installation)
7. [Features](#features)
8. [Utility Scripts](#utility-scripts)

---

## 🎯 System Overview

A comprehensive digital solution for managing university bus transportation including:
- **Student Pass Management** with university data integration
- **Real-time Bus Tracking** and occupancy monitoring
- **Admin Dashboard** for approvals and analytics
- **Driver Portal** for QR scanning and boarding logs
- **Ticket Booking System** for one-day passes

### Key Innovation: University Data Integration
- Student profiles auto-populate from `UniversityStudent` collection
- Read-only fields (name, email, phone, department, year) from official records
- Students can only upload profile photos
- Ensures data integrity and consistency

---

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- React 18 with Vite
- Modern CSS with custom styling
- React Router for navigation
- Axios for API calls
- Context API for state management

**Backend:**
- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT for authentication
- bcrypt for password hashing
- QR code generation for passes/tickets

### Project Structure

```
GUNI-BUS/
├── client/                          # React Frontend
│   ├── src/
│   │   ├── pages/                   # 7 pages
│   │   │   ├── Login.jsx
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── StudentProfile.jsx
│   │   │   ├── ApplyPass.jsx
│   │   │   ├── BuyTicket.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── DriverPortal.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Global auth state
│   │   ├── services/
│   │   │   └── api.js               # API service layer
│   │   ├── App.jsx                  # Routes & layout
│   │   ├── index.css                # Base styles
│   │   ├── modern.css               # Modern UI components
│   │   └── main.jsx                 # Entry point
│   └── public/
├── server/                          # Express Backend
│   ├── models/                      # 7 Mongoose models
│   │   ├── User.js
│   │   ├── UniversityStudent.js     # NEW: Official student data
│   │   ├── BusPass.js
│   │   ├── Ticket.js
│   │   ├── Route.js
│   │   ├── Bus.js
│   │   └── BoardingLog.js
│   ├── routes/                      # 9 API route files
│   │   ├── auth.js                  # Login/logout
│   │   ├── profile.js               # Profile management
│   │   ├── students.js              # Student operations
│   │   ├── passes.js                # Pass applications
│   │   ├── tickets.js               # Ticket purchase
│   │   ├── routes.js                # Bus routes
│   │   ├── shifts.js                # Shift management
│   │   ├── buses.js                 # Bus management
│   │   └── boarding.js              # Boarding logs
│   ├── middleware/
│   │   └── auth.js                  # JWT verification
│   ├── config/
│   │   └── database.js              # MongoDB connection
│   ├── utils/
│   │   └── referenceGenerator.js    # Generate ref numbers
│   ├── seedDatabase.js              # Main seed script
│   ├── seedUniversityData.js        # University student data
│   ├── seedRoutes.js                # Route data with stops
│   └── server.js                    # Express app entry
└── README.md
```

---

## 🗄️ Database Schema

### Collections

#### 1. **users**
Primary authentication and profile collection

```javascript
{
  enrollmentNumber: String (unique)   // Login username
  password: String (hashed)           // Hashed password
  role: String                        // 'student', 'admin', 'driver'
  name: String                        // Auto-populated from UniversityStudent
  email: String                       // Auto-populated from UniversityStudent
  phone: String                       // Auto-populated from UniversityStudent
  department: String                  // Auto-populated from UniversityStudent
  year: Number                        // Auto-populated from UniversityStudent
  profilePhoto: String                // Base64 image - ONLY editable field
  isProfileComplete: Boolean          // Auto-calculated
  isActive: Boolean                   // Account status
  timestamps: true
}
```

#### 2. **universitystudents** ⭐ NEW
Official university student records (read-only source of truth)

```javascript
{
  enrollmentNumber: String (unique)   // Links to User
  name: String                        // Official name
  email: String                       // University email
  phone: String                       // Contact number
  department: String                  // Academic department
  year: Number                        // Year of study (1-4)
  isActive: Boolean                   // Enrollment status
  timestamps: true
}
```

**Data Flow:**
1. Student logs in with `enrollmentNumber`
2. System fetches from `universitystudents` collection
3. Auto-updates `users` collection with official data
4. Profile marked complete if photo exists

#### 3. **buspasses**
Semester bus pass applications and status

```javascript
{
  studentId: ObjectId (ref: User)
  routeId: ObjectId (ref: Route)
  selectedStop: String
  shift: String                       // 'morning' or 'afternoon'
  paymentMethod: String               // 'online' or 'cash'
  status: String                      // 'pending', 'approved', 'rejected'
  qrCode: String                      // Generated QR code
  validFrom: Date
  validUntil: Date
  referenceNumber: String (unique)    // e.g., BP-2024-001234
  amount: Number
  timestamps: true
}
```

#### 4. **tickets**
One-day bus tickets

```javascript
{
  studentId: ObjectId (ref: User)
  routeId: ObjectId (ref: Route)
  shift: String
  travelDate: Date
  qrCode: String
  referenceNumber: String (unique)    // e.g., TKT-2024-001234
  amount: Number
  status: String                      // 'active', 'used'
  timestamps: true
}
```

#### 5. **routes**
Bus routes with stops and pricing

```javascript
{
  routeNumber: String (unique)        // e.g., 'AMD-01'
  routeName: String                   // e.g., 'Ahmedabad Route'
  startPoint: String
  endPoint: String
  semesterCharge: Number              // Dynamic pricing per route
  shifts: [{
    shiftType: String                 // 'morning', 'afternoon'
    stops: [{
      name: String
      arrivalTime: String
    }]
  }]
  isActive: Boolean
  timestamps: true
}
```

#### 6. **buses**
Bus fleet management

```javascript
{
  busNumber: String (unique)
  registrationNumber: String
  capacity: Number
  routeId: ObjectId (ref: Route)
  driverId: ObjectId (ref: User)
  shift: String
  isActive: Boolean
  timestamps: true
}
```

#### 7. **boardinglogs**
Track student boarding and occupancy

```javascript
{
  studentId: ObjectId (ref: User)
  busId: ObjectId (ref: Bus)
  boardingTime: Date
  stop: String
  passOrTicketId: ObjectId
  type: String                        // 'pass' or 'ticket'
  timestamps: true
}
```

---

## 🔌 API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/login` | Student/Admin/Driver login | No |
| POST | `/logout` | Logout | No |

**Login Flow:**
1. Validates credentials against `users` collection
2. If student role, fetches from `universitystudents`
3. Auto-populates user profile
4. Returns JWT token + updated profile

### Profile Routes (`/api/profile`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/profile` | Get current user profile | Yes |
| PUT | `/profile` | Update profile photo ONLY | Yes |

**Note:** Only `profilePhoto` can be updated. All other fields are read-only.

### Student Routes (`/api/students`)

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/` | List all students | Yes | Admin |
| GET | `/:id` | Get student details | Yes | Admin |
| GET | `/:id/passes` | Get student's passes | Yes | Admin |
| GET | `/:id/tickets` | Get student's tickets | Yes | Admin |

### Pass Routes (`/api/passes`)

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/apply` | Apply for semester pass | Yes | Student |
| GET | `/my-passes` | Get current user's passes | Yes | Student |
| GET | `/` | List all passes | Yes | Admin |
| PUT | `/:id/approve` | Approve pass | Yes | Admin |
| PUT | `/:id/reject` | Reject pass | Yes | Admin |

### Ticket Routes (`/api/tickets`)

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/purchase` | Buy one-day ticket | Yes | Student |
| GET | `/my-tickets` | Get current user's tickets | Yes | Student |

### Route Routes (`/api/routes`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | List all active routes | Yes |
| GET | `/:id` | Get route details | Yes |

### Shift Routes (`/api/shifts`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/:routeId` | Get shifts for a route | Yes |

### Bus Routes (`/api/buses`)

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/` | List all buses | Yes | Admin |
| POST | `/` | Create new bus | Yes | Admin |
| PUT | `/:id` | Update bus | Yes | Admin |
| DELETE | `/:id` | Delete bus | Yes | Admin |

### Boarding Routes (`/api/boarding`)

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/scan` | Scan QR code | Yes | Driver |
| GET | `/logs` | Get boarding logs | Yes | Driver |
| GET | `/bus/:busId` | Get logs for specific bus | Yes | Driver |

---

## 🖥️ Frontend Pages

### 1. **Login** (`/`)
- Universal login for all roles
- Enrollment number + password
- Redirects based on role:
  - Student → `/student`
  - Admin → `/admin`
  - Driver → `/driver`

### 2. **Student Dashboard** (`/student`)
- View active pass status
- Quick stats (passes, tickets)
- Navigation to apply pass/buy ticket
- Profile completion status

### 3. **Student Profile** (`/student/profile`)
- **Read-only fields**: Name, Email, Phone, Department, Year
- **Editable**: Profile photo upload only
- Info banner: "Details from university records"
- Photo upload with 2MB limit

### 4. **Apply Pass** (`/student/apply-pass`)
- **Profile check on load** - shows warning if incomplete
- **Quick photo upload** - can upload directly from this page
- **User profile card** - displays all student details
- Route selection with dynamic pricing
- Shift selection (morning/afternoon)
- Stop selection with timeline view
- Payment method (online/cash)
- Reference number generation

### 5. **Buy Ticket** (`/student/buy-ticket`)
- One-day ticket purchase
- Route and shift selection
- Travel date picker
- Payment integration
- QR code generation

### 6. **Admin Dashboard** (`/admin`)
- **Pending passes** - approve/reject
- **Student management** - view all students
- **Bus management** - CRUD operations
- **Analytics** - pass stats, revenue
- **Route management**

### 7. **Driver Portal** (`/driver`)
- QR code scanner
- Boarding log management
- Current occupancy tracking
- Shift-based views

---

## 🚀 Setup & Installation

### Prerequisites

- Node.js (v16+)
- MongoDB (local or Atlas)
- npm or yarn

### Environment Setup

1. **Clone repository**
   ```bash
   git clone <repo-url>
   cd GUNI-BUS
   ```

2. **Server setup**
   ```bash
   cd server
   npm install
   ```

   Create `.env` file:
   ```env
   MONGODB_URI=mongodb://localhost:27017/university-bus-system
   JWT_SECRET=your-secret-key-here
   PORT=5000
   ```

3. **Client setup**
   ```bash
   cd client
   npm install
   ```

   Create `.env` file:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

### Database Seeding

Run in order:

1. **Seed university student data**
   ```bash
   cd server
   node seedUniversityData.js
   ```
   Creates 8 sample university students (enrollment: 202201001-202201008)

2. **Seed routes**
   ```bash
   node seedRoutes.js
   ```
   Creates 12 bus routes with stops and pricing

3. **Seed main database**
   ```bash
   node seedDatabase.js
   ```
   Creates users, buses, admin accounts

### Running the Application

1. **Start backend**
   ```bash
   cd server
   npm run dev
   ```
   Server runs on `http://localhost:5000`

2. **Start frontend**
   ```bash
   cd client
   npm run dev
   ```
   Client runs on `http://localhost:5173`

### Test Login Credentials

After seeding: | Role | Enrollment | Password |
|------|------------|----------|
| Admin | admin | 123 |
| Student | 202201001 | (set during user creation) |
| Driver | driver | 123 |

---

## ✨ Features

### University Data Integration ⭐
- **Auto-population**: Login triggers data sync from university database
- **Read-only enforcement**: Name, email, phone, department, year cannot be edited
- **Profile completion**: Only photo upload required
- **Data integrity**: Single source of truth for student information

### Student Portal
- Apply for semester bus passes
- Purchase one-day tickets
- View active passes/tickets with QR codes
- Profile management (photo upload only)
- Real-time application status

### Admin Dashboard
- Approve/reject pass applications
- Student management and search
- Bus fleet management
- Route and shift configuration
- Analytics and reporting

### Driver Portal
- QR code scanning for verification
- Boarding log entry
- Real-time occupancy tracking
- Shift-based views

### Payment System
- Online payment integration (Razorpay)
- Cash payment tracking
- Reference number generation
- Payment status management

---

## 🔧 Utility Scripts

Located in `server/` directory - **one-time use only**:

### `seedDatabase.js`
Main seed script - creates users, buses, sample data

### `seedUniversityData.js` ⭐
Seeds official university student records
```bash
node seedUniversityData.js
```

### `seedRoutes.js`
Seeds 12 bus routes with stops and dynamic pricing
```bash
node seedRoutes.js
```

### ⚠️ Cleanup Candidates (Optional Scripts)

These scripts were used for one-time migrations/updates and can be removed:

#### `resetUsers.js`
- Creates basic test users (admin/student/driver)
- **Status**: Can be removed (use seedDatabase.js instead)

#### `updateUsers.js`
- One-time migration to add isProfileComplete field
- **Status**: Can be removed (field now in model)

#### `updateRoutePrices.js`
- One-time update of route pricing
- **Status**: Can be removed (prices in seedRoutes.js)

**Recommendation:** Keep for reference or delete if database is properly seeded.

---

## 📝 Important Notes

### Profile System
- Students CANNOT edit: name, email, phone, department, year
- Students CAN edit: profile photo only
- Profile auto-syncs on every login
- Profile completion = university data + photo

### Pass Application
- Requires complete profile (including photo)
- Can upload photo directly from apply pass page
- Dynamic pricing per route
- Semester validity (6 months)

### Data Flow
```
Login → Fetch UniversityStudent → Update User → Return Profile
```

### Security
- JWT tokens for authentication
- Bcrypt password hashing
- Role-based access control
- Server-side validation

---

## 🎯 Next Steps for Production

1. **Import real university data** into `universitystudents` collection
2. **Configure Razorpay** with production keys
3. **Set up periodic sync** for university data updates
4. **Configure CORS** for production domains
5. **Set up MongoDB Atlas** for cloud database
6. **Deploy backend** (Render/Railway)
7. **Deploy frontend** (Vercel/Netlify)

---

## 📞 Support

For issues or questions, refer to the code comments or check the API route files for detailed implementation.

---

**Last Updated:** January 2026  
**Version:** 2.0 (with University Data Integration)
