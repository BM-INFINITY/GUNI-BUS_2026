const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Login
router.post('/login', async (req, res) => {
    try {
        const { enrollmentNumber, password } = req.body;

        // Find user by enrollment number
        const user = await User.findOne({ enrollmentNumber });

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
                role: user.role,
                department: user.department,
                year: user.year,
                mobile: user.mobile,
                dateOfBirth: user.dateOfBirth,
                profilePhoto: user.profilePhoto,
                isProfileComplete: user.isProfileComplete,
                hasCompletedProfileOnce: user.hasCompletedProfileOnce,
                profileChangeRequest: user.profileChangeRequest
            },
            redirectTo
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Logout (client-side token removal mainly)
router.post('/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

module.exports = router;
