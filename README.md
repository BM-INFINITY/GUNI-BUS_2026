# University Bus Transportation System

A complete digital solution for university bus pass management, real-time tracking, and occupancy monitoring.

## Features

- **Student Portal**: Apply for semester passes, purchase one-day tickets, track buses in real-time
- **Admin Dashboard**: Approve passes, manage students, buses, and routes, view analytics
- **Driver Portal**: Scan passes/tickets, manage occupancy, view boarding logs
- **Real-time Tracking**: Live bus location updates via existing tracking system
- **Dual Shift Support**: Morning and afternoon shift management
- **Payment Integration**: Razorpay test mode and cash payment tracking

## Technology Stack

### Frontend
- React.js with Vite
- Tailwind CSS
- Socket.io Client
- React Router
- Axios

### Backend
- Node.js with Express.js
- MongoDB with Mongoose
- Socket.io
- JWT Authentication
- QR Code Generation

## Project Structure

```
university-bus-system/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   └── utils/
│   └── public/
├── server/                 # Express backend
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   ├── utils/
│   └── config/
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
2. Install backend dependencies:
   ```bash
   cd server
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd client
   npm install
   ```

4. Set up environment variables (create `.env` in server directory):
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   PORT=5000
   RAZORPAY_KEY_ID=your_razorpay_key
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   ```

5. Start the backend:
   ```bash
   cd server
   npm run dev
   ```

6. Start the frontend:
   ```bash
   cd client
   npm run dev
   ```

## User Roles

- **Students**: Login with enrollment number, apply for passes, purchase tickets
- **Admins**: Manage all aspects of the system
- **Drivers**: Scan passes, update occupancy

## License

MIT
