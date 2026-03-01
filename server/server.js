const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const socketIo = require("socket.io");
const connectDB = require("./config/database");

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Initialize absence detection cron job
const { initAbsenceDetection } = require('./jobs/absenceDetection');
initAbsenceDetection();

// Initialize Ride Intent cron jobs (requires io — initialized below after socket setup)
let initRideIntentJobsFn;
try { initRideIntentJobsFn = require('./jobs/rideIntentJobs').initRideIntentJobs; } catch (e) { console.error('rideIntentJobs not found', e); }

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.CLIENT_URL || "https://nc2l25sv-5173.inc1.devtunnels.ms",
        methods: ["GET", "POST", "PUT", "DELETE"],
    },
});

// Make io accessible to routes
app.set("io", io);

// Middleware
/* app.use(cors({ origin: '*' }));*/
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global Request Logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Routes
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const studentRoutes = require("./routes/students");
const routeRoutes = require("./routes/routes");
const passRoutes = require("./routes/passes");
const adminRoutes = require("./routes/admin");
const paymentRoutes = require("./routes/payment");
const attendanceRoutes = require('./routes/attendance');
const adminAnalyticsRoutes = require("./routes/adminAnalytics");
const driverRoutes = require("./routes/driver");
const driverScanRoutes = require("./routes/driverScan");
const dayTicketsRoutes = require("./routes/dayTicketsApi");
const dayTicketPaymentRoutes = require("./routes/dayTicketPayment");
const dayTicketScanRoutes = require("./routes/dayTicketScan");
const adminTicketsRoutes = require("./routes/adminTickets");
const allowedBookingDaysRoutes = require("./routes/allowedBookingDaysApi");
const tripCheckpointsRoutes = require("./routes/tripCheckpoints");
const journeyTrackingRoutes = require("./routes/journeyTracking");
const lostFoundRoutes = require("./routes/lostFound");
const rideIntentRoutes = require("./routes/rideIntent");
const forecastRoutes = require("./routes/demandForecast");
const complaintsRoutes = require('./routes/complaints');

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/passes", passRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payment", paymentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use("/api/admin/analytics", adminAnalyticsRoutes);
app.use("/api/admin/tickets", adminTicketsRoutes);
app.use("/api/driver", driverRoutes);
app.use("/api/driver/scan", driverScanRoutes);

// Fix: Mount DayTickets on multiple paths to handle potential frontend mismatches
app.use("/api/day-tickets", dayTicketsRoutes);
app.use("/api/tickets", dayTicketsRoutes); // Alias for backward compatibility

app.use("/api/day-ticket-payment", dayTicketPaymentRoutes);
app.use("/api/day-ticket-scan", dayTicketScanRoutes);
app.use("/api/admin/allowed-booking-days", allowedBookingDaysRoutes);

// Journey tracking and checkpoint routes
app.use("/api/checkpoints", tripCheckpointsRoutes);
app.use("/api/journey", journeyTrackingRoutes);

// Lost & Found
app.use("/api/lost-found", lostFoundRoutes);

// Ride Intent & Demand Forecast
app.use("/api/ride-intent", rideIntentRoutes);
app.use("/api/forecast", forecastRoutes);
app.use("/api/complaints", complaintsRoutes);

// Health check route
app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date() });
});

// WebSocket connection handling
io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });

    // Listen for bus location updates
    socket.on("bus:location:update", (data) => {
        // Broadcast to all connected clients
        io.emit("bus:location:update", data);
    });
});

// Initialize Ride Intent cron jobs now that io is ready
if (initRideIntentJobsFn) initRideIntentJobsFn(io);

// Mock tracking API integration (simulates polling existing bus tracking system)
setInterval(() => {
    // TODO: Replace with actual tracking API integration
    // This is a mock implementation that simulates bus location updates
    // For now, we'll just emit a sample update every 10 seconds
    // In production, this would poll the actual tracking system API
}, 10000);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Error:", err);
    res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log("ENV CHECK:", {
        NODE_ENV: process.env.NODE_ENV,
        TIME_MODE: process.env.TIME_MODE,
    });
    console.log(`WebSocket server ready`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${PORT} is already in use.`);
        console.error(`   Run: netstat -ano | findstr :${PORT}  then  taskkill /PID <pid> /F\n`);
        process.exit(1);
    } else {
        throw err;
    }
});