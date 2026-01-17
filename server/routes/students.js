const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { auth, isAdmin } = require('../middleware/auth');

// Create student account (Admin only)
router.post('/', auth, isAdmin, async(req, res) => {
    try {
        const { name, email, enrollmentNumber, password, phone, department, year, role } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { enrollmentNumber }]
        });

        if (existingUser) {
            return res.status(400).json({ message: 'User with this email or enrollment number already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);


        // Create new user
        const user = new User({
            name,
            email,
            enrollmentNumber,
            password: hashedPassword,
            phone,
            department,
            year,
            role: role || 'student'
        });

        await user.save();

        res.status(201).json({
            message: 'Student account created successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                enrollmentNumber: user.enrollmentNumber,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Create student error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all students (Admin only)
router.get('/', auth, isAdmin, async(req, res) => {
    try {
        const students = await User.find({ role: 'student' }).select('-password');
        res.json(students);
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get student by ID
router.get('/:id', auth, async(req, res) => {
    try {
        const student = await User.findById(req.params.id).select('-password');

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.json(student);
    } catch (error) {
        console.error('Get student error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update student (Admin only)
router.put('/:id', auth, isAdmin, async(req, res) => {
    try {
        const { name, email, phone, department, year, isActive } = req.body;

        const student = await User.findByIdAndUpdate(
            req.params.id, { name, email, phone, department, year, isActive }, { new: true, runValidators: true }
        ).select('-password');

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.json({ message: 'Student updated successfully', student });
    } catch (error) {
        console.error('Update student error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete student (Admin only)
router.delete('/:id', auth, isAdmin, async(req, res) => {
    try {
        const student = await User.findByIdAndDelete(req.params.id);

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        console.error('Delete student error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;