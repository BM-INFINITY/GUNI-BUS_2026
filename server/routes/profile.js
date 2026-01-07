const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');

// Get student profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update student profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { name, email, phone, department, year, profilePhoto } = req.body;

        // Validate required fields
        if (!name || !email || !phone || !department || !year) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update fields
        user.name = name;
        user.email = email;
        user.phone = phone;
        user.department = department;
        user.year = year;

        if (profilePhoto) {
            user.profilePhoto = profilePhoto;
        }

        // Mark profile as complete
        user.isProfileComplete = true;

        await user.save();

        const updatedUser = await User.findById(req.user._id).select('-password');
        res.json({
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
