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

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "DELETE"],
    },
});

// Make io accessible to routes
app.set("io", io);

// Middleware
app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE"],
    }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log("ENV CHECK:", {
        NODE_ENV: process.env.NODE_ENV,
        TIME_MODE: process.env.TIME_MODE,
    });
    console.log(`WebSocket server ready`);
});