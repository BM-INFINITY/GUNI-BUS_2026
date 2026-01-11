const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');

// Get current user profile
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
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

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update photo
        user.profilePhoto = profilePhoto;

        // Check if profile is complete (has all required data + photo)
        // Profile is complete if: has all data, has photo, and NO pending change request
        if (user.name && user.email && user.mobile && user.department && user.year && user.dateOfBirth) {
            const hasPendingRequest = user.profileChangeRequest && user.profileChangeRequest.status === 'pending';
            // Only set as complete if there's no pending request
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
        console.error('Update photo error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Request profile change
router.post('/request-change', auth, async (req, res) => {
    try {
        const { requestedChanges, reason } = req.body;

        if (!requestedChanges || !reason) {
            return res.status(400).json({ message: 'Requested changes and reason are required' });
        }

        const user = await User.findById(req.user._id);

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
        const user = await User.findById(req.user._id);

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
