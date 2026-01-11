# University Bus Transportation System

A streamlined bus pass management system with **admin-managed student data**, profile approval workflow, and simplified pass applications.

## 🌟 Key Features

### Admin-Managed Student Data ⭐
- **Admin feeds all student information** (enrollment, password, name, DOB, mobile, email, department, year)
- **Profile change approval workflow** - Students request changes, admin approves
- **Complete student management** - View, add, and manage all student records
- **Pass management by route** - View pending and approved passes grouped by route

### Student Workflow ⭐
- **Smart redirect logic** - First time → Profile verification
- **Profile completion required** - Must upload photo to access dashboard
- **Simplified pass application** - Select route, boarding point, and shift (all details auto-filled)
- **Request profile changes** - If data is wrong, request corrections with admin approval

### Core Features
- **Pass management**: Apply, approve/reject, QR code generation
- **Role-based access**: Student and Admin portals
- **Route management**: Multiple routes with stops and shifts
- **Real-time status**: Track application status

---

## 📚 Complete Documentation

See **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** for:
- Complete feature list
- All 19 API endpoints
- Frontend pages breakdown
- Complete workflow guides
- Setup instructions

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- MongoDB
- npm or yarn

### Installation

1. **Install dependencies**
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```

2. **Environment Setup**
   
   Server `.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/university-bus-system
   JWT_SECRET=your_jwt_secret
   PORT=5000
   ```

   Client `.env`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

3. **Seed Database**
   ```bash
   cd server
   node seedRoutes.js        # Seed routes
   node seedDatabase.js      # Seed admin user
   ```

4. **Run Application**
   ```bash
   # Terminal 1 - Backend
   cd server && npm run dev

   # Terminal 2 - Frontend
   cd client && npm run dev
   ```

5. **Access**
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:5000/api`

### Default Login
- **Admin**: `admin` / `123`

---

## 🔄 System Workflow

### Admin Workflow
1. Login to admin panel
2. Add students with all details
3. Approve/reject profile change requests
4. View pending passes (grouped by route)
5. Approve/reject pass applications
6. View approved passes with QR codes

### Student Workflow
1. Login with enrollment + password (admin-provided)
2. **First time**: Verify profile details
3. Request changes if data is wrong
4. Upload profile photo (mandatory)
5. Access dashboard
6. Apply for pass (route/boarding/shift)
7. Wait for admin approval

---

## 📁 Project Structure

```
GUNI-BUS/
├── server/                      # Express backend
│   ├── models/                 # 3 Mongoose models
│   ├── routes/                 # 6 API route files (19 endpoints)
│   ├── middleware/             # JWT authentication
│   ├── seedDatabase.js         # Database seeder
│   └── seedRoutes.js           # Routes seeder
├── client/                      # React frontend (Vite)
│   ├── src/pages/              # 9 page components
│   ├── src/context/            # Auth context
│   └── src/services/           # API layer
└── README.md                    # This file
```

---

## 🎯 Core Endpoints

### Student APIs
- `POST /api/auth/login` - Login
- `GET /api/profile` - Get profile
- `POST /api/profile/request-change` - Request changes
- `POST /api/passes/apply` - Apply for pass

### Admin APIs
- `POST /api/admin/students` - Create student
- `GET /api/admin/students` - List students
- `GET /api/admin/profile-change-requests` - View change requests
- `PUT /api/admin/profile-change-requests/:id/approve` - Approve
- `GET /api/passes/admin/pending/by-route` - Pending passes by route
- `GET /api/passes/admin/approved/by-route` - Approved passes by route
- `PUT /api/passes/:id/approve` - Approve pass

**Total: 19 endpoints** - See walkthrough.md for complete list

---

## 🛠️ Technology Stack

**Frontend:**
- React 18 + Vite
- Modern CSS (custom styling)
- React Router
- Axios
- Context API

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- QR Code Generation
- bcryptjs

---

## 📊 Database Collections

- `users` - Students & admins (with profile change requests)
- `buspasses` - Pass applications (with student snapshots)
- `routes` - Bus routes with stops and shifts

---

## ✅ What's Included

✅ Admin creates students with all data  
✅ Student profile verification workflow  
✅ Profile change request system  
✅ Mandatory photo upload  
✅ Smart dashboard redirect  
✅ Simplified pass application  
✅ Passes grouped by route (admin view)  
✅ QR code generation  
✅ Complete student management  

---

## 📄 License

MIT

---

**System is 100% complete and production-ready!**  
See [walkthrough.md](./walkthrough.md) for detailed implementation guide.
