const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { auth, isAdmin } = require('../middleware/auth');
const User = require('../models/User');
const BusPass = require('../models/BusPass');
const DailyAttendance = require('../models/DailyAttendance');

// Create new student (Admin only)
router.post('/students', auth, isAdmin, async (req, res) => {
    try {
        const {
            enrollmentNumber,
            password,
            name,
            dateOfBirth,
            mobile,
            email,
            department,
            year
        } = req.body;

        // Validate required fields
        if (!enrollmentNumber || !password || !name || !dateOfBirth || !mobile || !email || !department || !year) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if student already exists
        const existingUser = await User.findOne({ enrollmentNumber });
        if (existingUser) {
            return res.status(400).json({ message: 'Student with this enrollment number already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new student
        const student = new User({
            enrollmentNumber,
            password: hashedPassword,
            role: 'student',
            name,
            dateOfBirth,
            mobile,
            email,
            department,
            year,
            isProfileComplete: false,
            hasCompletedProfileOnce: false,
            createdBy: req.user._id
        });

        await student.save();

        res.status(201).json({
            message: 'Student created successfully',
            student: {
                id: student._id,
                enrollmentNumber: student.enrollmentNumber,
                name: student.name,
                email: student.email,
                department: student.department,
                year: student.year
            }
        });
    } catch (error) {
        console.error('Create student error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all students (Admin only)
router.get('/students', auth, isAdmin, async (req, res) => {
    try {
        const { search, department, year, page = 1, limit = 20 } = req.query;

        const query = { role: 'student' };

        // Search by enrollment or name
        if (search) {
            query.$or = [
                { enrollmentNumber: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by department
        if (department) {
            query.department = department;
        }

        // Filter by year
        if (year) {
            query.year = parseInt(year);
        }

        const students = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await User.countDocuments(query);

        res.json({
            students,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            totalStudents: count
        });
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get student details (Admin only)
router.get('/students/:id', auth, isAdmin, async (req, res) => {
    try {
        const student = await User.findById(req.params.id).select('-password');

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Get student's pass history
        const passes = await BusPass.find({ userId: req.params.id })
            .populate('route', 'routeName routeNumber')
            .sort({ createdAt: -1 });

        res.json({
            student,
            passes
        });
    } catch (error) {
        console.error('Get student details error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all profile change requests (Admin only)
router.get('/profile-change-requests', auth, isAdmin, async (req, res) => {
    try {
        const students = await User.find({
            role: 'student',
            'profileChangeRequest.status': 'pending'
        }).select('-password');

        const requests = students.map(student => ({
            studentId: student._id,
            enrollmentNumber: student.enrollmentNumber,
            studentName: student.name,
            currentData: {
                name: student.name,
                dateOfBirth: student.dateOfBirth,
                mobile: student.mobile,
                email: student.email,
                department: student.department,
                year: student.year
            },
            requestedChanges: student.profileChangeRequest.requestedChanges,
            reason: student.profileChangeRequest.reason,
            requestedAt: student.profileChangeRequest.requestedAt
        }));

        res.json(requests);
    } catch (error) {
        console.error('Get change requests error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Approve profile change request (Admin only)
router.put('/profile-change-requests/:studentId/approve', auth, isAdmin, async (req, res) => {
    try {
        const student = await User.findById(req.params.studentId);

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        if (!student.profileChangeRequest || student.profileChangeRequest.status !== 'pending') {
            return res.status(400).json({ message: 'No pending change request found' });
        }

        // Apply the requested changes
        const changes = student.profileChangeRequest.requestedChanges;
        if (changes.name) student.name = changes.name;
        if (changes.dateOfBirth) student.dateOfBirth = changes.dateOfBirth;
        if (changes.mobile) student.mobile = changes.mobile;
        if (changes.email) student.email = changes.email;
        if (changes.department) student.department = changes.department;
        if (changes.year) student.year = changes.year;

        // Update request status
        student.profileChangeRequest.status = 'approved';
        student.profileChangeRequest.reviewedBy = req.user._id;
        student.profileChangeRequest.reviewedAt = new Date();

        // Mark profile as complete if photo exists
        if (student.profilePhoto) {
            student.isProfileComplete = true;
        }

        await student.save();

        res.json({
            message: 'Profile change request approved successfully',
            student: {
                id: student._id,
                enrollmentNumber: student.enrollmentNumber,
                name: student.name
            }
        });
    } catch (error) {
        console.error('Approve change request error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reject profile change request (Admin only)
router.put('/profile-change-requests/:studentId/reject', auth, isAdmin, async (req, res) => {
    try {
        const { rejectionReason } = req.body;

        const student = await User.findById(req.params.studentId);

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        if (!student.profileChangeRequest || student.profileChangeRequest.status !== 'pending') {
            return res.status(400).json({ message: 'No pending change request found' });
        }

        // Update request status
        student.profileChangeRequest.status = 'rejected';
        student.profileChangeRequest.reviewedBy = req.user._id;
        student.profileChangeRequest.reviewedAt = new Date();
        student.profileChangeRequest.rejectionReason = rejectionReason || 'Request rejected by admin';

        // Mark profile as complete if photo exists (rejecting doesn't affect profile)
        if (student.profilePhoto) {
            student.isProfileComplete = true;
        }

        await student.save();

        res.json({
            message: 'Profile change request rejected',
            student: {
                id: student._id,
                enrollmentNumber: student.enrollmentNumber,
                name: student.name
            }
        });
    } catch (error) {
        console.error('Reject change request error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get today's attendance by route
router.get('/today-attendance', auth, isAdmin, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const data = await DailyAttendance.aggregate([
            { $match: { date: today } },
            {
                $group: {
                    _id: "$routeId",
                    checkIns: { $sum: 1 },
                    checkOuts: {
                        $sum: {
                            $cond: [{ $ne: ["$checkOutTime", null] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        // Populate route details
        const populatedData = await Promise.all(
            data.map(async (item) => {
                const route = await require('../models/Route').findById(item._id);
                return {
                    ...item,
                    routeName: route?.routeName,
                    routeNumber: route?.routeNumber
                };
            })
        );

        res.json(populatedData);
    } catch (error) {
        console.error('Get today attendance error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
