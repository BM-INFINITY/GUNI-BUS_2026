const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');

// Get current user profile
router.get('/', auth, async (req, res) => {
    try {
        // req.user is already the full user object from auth middleware
        res.json(req.user);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Upload profile photo
router.put('/photo', auth, async (req, res) => {
    try {
        const { profilePhoto } = req.body;

        if (!profilePhoto) {
            return res.status(400).json({ message: 'Profile photo is required' });
        }

        // 🔐 Validate image size (base64 → approx bytes)
        const MAX_SIZE = 2 * 1024 * 1024; // 2MB
        const base64Size = profilePhoto.length * 0.75; // approximate

        if (base64Size > MAX_SIZE) {
            return res.status(400).json({
                message: 'Image size is too large. Please upload image smaller than 2MB.'
            });
        }

        const user = req.user; // Already fetched by auth middleware

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update photo
        user.profilePhoto = profilePhoto;

        // Mark profile complete only if no pending request
        if (user.name && user.email && user.mobile && user.department && user.year && user.dateOfBirth) {
            const hasPendingRequest = user.profileChangeRequest?.status === 'pending';
            if (!hasPendingRequest) {
                user.isProfileComplete = true;
            }
        }

        await user.save();

        const updatedUser = await User.findById(req.user._id).select('-password');

        res.json({
            message: 'Profile photo updated successfully',
            user: updatedUser
        });

    } catch (error) {
        console.error("PHOTO UPLOAD ERROR:", error.message);
        console.error(error);
        res.status(500).json({ message: error.message || 'Server error while uploading image' });
    }

});


// Request profile change
router.post('/request-change', auth, async (req, res) => {
    try {
        const { requestedChanges, reason } = req.body;

        if (!requestedChanges || !reason) {
            return res.status(400).json({ message: 'Requested changes and reason are required' });
        }

        const user = req.user; // Already fetched by auth middleware

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if there's already a pending request
        if (user.profileChangeRequest && user.profileChangeRequest.status === 'pending') {
            return res.status(400).json({ message: 'You already have a pending change request' });
        }

        user.profileChangeRequest = {
            requestedChanges,
            reason,
            status: 'pending',
            requestedAt: new Date()
        };

        // Mark profile as incomplete while request is pending
        user.isProfileComplete = false;

        await user.save();

        const updatedUser = await User.findById(req.user._id).select('-password');
        res.json({
            message: 'Profile change request submitted successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Request change error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Mark profile as completed once (student has seen profile page)
router.put('/mark-complete', auth, async (req, res) => {
    try {
        const user = req.user; // Already fetched by auth middleware

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Only mark as complete if profile is actually complete
        if (!user.isProfileComplete) {
            return res.status(400).json({ message: 'Profile is not complete. Please upload photo and resolve any pending changes.' });
        }

        user.hasCompletedProfileOnce = true;
        await user.save();

        const updatedUser = await User.findById(req.user._id).select('-password');
        res.json({
            message: 'Profile marked as complete',
            user: updatedUser
        });
    } catch (error) {
        console.error('Mark complete error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
