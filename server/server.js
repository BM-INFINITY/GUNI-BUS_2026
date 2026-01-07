const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/database');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

// Make io accessible to routes
app.set('io', io);

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const passRoutes = require('./routes/passes');
const ticketRoutes = require('./routes/tickets');
const busRoutes = require('./routes/buses');
const routeRoutes = require('./routes/routes');
const boardingRoutes = require('./routes/boarding');
const shiftRoutes = require('./routes/shifts');
const profileRoutes = require('./routes/profile');

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/passes', passRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/boarding', boardingRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/profile', profileRoutes);

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date() });
});

// WebSocket connection handling
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });

    // Listen for bus location updates
    socket.on('bus:location:update', (data) => {
        // Broadcast to all connected clients
        io.emit('bus:location:update', data);
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
    console.error('Error:', err);
    res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`WebSocket server ready`);
});
