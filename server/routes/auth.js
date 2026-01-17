const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Unified Login
router.post('/login', async (req, res) => {
    try {
        const { loginId, password } = req.body;

        // Try determining if it's an enrollment number or employee ID
        // Simplified: Search in both fields
        const user = await User.findOne({
            $or: [
                { enrollmentNumber: loginId },
                { employeeId: loginId }
            ]
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(403).json({ message: 'Account is deactivated' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        // Determine redirect path based on role and profile status
        let redirectTo = '/';

        if (user.role === 'admin') {
            redirectTo = '/admin';
        } else if (user.role === 'driver') {
            redirectTo = '/driver';
        } else if (user.role === 'student') {
            // First time login or profile incomplete -> redirect to profile
            if (!user.hasCompletedProfileOnce || !user.isProfileComplete) {
                redirectTo = '/student/profile';
            } else {
                redirectTo = '/student';
            }
        }

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                enrollmentNumber: user.enrollmentNumber,
                employeeId: user.employeeId,
                role: user.role,
                department: user.department,
                year: user.year,
                mobile: user.mobile,
                dateOfBirth: user.dateOfBirth,
                profilePhoto: user.profilePhoto,
                isProfileComplete: user.isProfileComplete,
                hasCompletedProfileOnce: user.hasCompletedProfileOnce,
                profileChangeRequest: user.profileChangeRequest,
                assignedRoute: user.assignedRoute,
                assignedBus: user.assignedBus,
                shift: user.shift
            },
            redirectTo
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Driver Login
router.post('/driver/login', async (req, res) => {
    try {
        const { employeeId, password } = req.body;

        // Find driver by employeeId
        const driver = await User.findOne({ employeeId, role: 'driver' });

        if (!driver) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, driver.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check if active
        if (!driver.isActive) {
            return res.status(403).json({ message: 'Account is deactivated' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: driver._id, role: driver.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: driver._id,
                name: driver.name,
                role: driver.role,
                employeeId: driver.employeeId,
                mobile: driver.mobile,
                email: driver.email,
                assignedRoute: driver.assignedRoute,
                assignedBus: driver.assignedBus,
                shift: driver.shift
            },
            redirectTo: '/driver'
        });

    } catch (error) {
        console.error('Driver login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


// Logout (client-side token removal mainly)
router.post('/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

module.exports = router;
