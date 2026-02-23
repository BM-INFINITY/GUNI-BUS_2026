const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { auth, isAdmin } = require('../middleware/auth');
const User = require('../models/User');
const BusPass = require('../models/BusPass');
const DailyAttendance = require('../models/DailyAttendance');
const Bus = require('../models/Bus');
const multer = require('multer');
const csv = require('csv-parser');
const { Readable } = require('stream');

// Configure Multer (Memory Storage)
const upload = multer({ storage: multer.memoryStorage() });

function parseExcelDate(value) {
    if (!value) return null;

    // If already valid ISO date
    if (typeof value === "string" && !isNaN(Date.parse(value))) {
        return new Date(value);
    }

    // If Excel serial number
    if (!isNaN(value)) {
        const excelEpoch = new Date(1899, 11, 30);
        return new Date(excelEpoch.getTime() + value * 86400000);
    }

    return null;
}

// Create new student (Admin only)
// Bulk Upload Students (CSV)
router.post('/students/upload', auth, isAdmin, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const results = [];
        const stream = Readable.from(req.file.buffer);

        stream
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                let successCount = 0;
                let failCount = 0;
                const errors = [];

                for (const row of results) {
                    try {
                        // Extract fields (adjust keys based on CSV headers)
                        // Expected: enrollmentNumber, name, email, mobile, department, year, dateOfBirth
                        const {
                            enrollmentNumber,
                            name,
                            email,
                            mobile,
                            department,
                            year,
                            dateOfBirth
                        } = row;

                        if (!enrollmentNumber || !email) {
                            failCount++;
                            errors.push(`Missing required fields for row: ${JSON.stringify(row)}`);
                            continue;
                        }

                        // Check existence
                        const existing = await User.findOne({
                            $or: [{ enrollmentNumber }, { email }]
                        });

                        if (existing) {
                            failCount++;
                            errors.push(`Student exists: ${enrollmentNumber}`);
                            continue;
                        }

                        // Create Student
                        const salt = await bcrypt.genSalt(10);
                        // Default password is 123
                        const def_pass = '123'
                        const hashedPassword = await bcrypt.hash(def_pass, salt);

                        const newStudent = new User({
                            enrollmentNumber,
                            password: hashedPassword,
                            name,
                            email,
                            mobile: mobile || '0000000000',
                            department: department || 'General',
                            year: year ? parseInt(year) : 1,
                            dateOfBirth: parseExcelDate(dateOfBirth) || new Date(),
                            role: 'student',
                            isProfileComplete: false
                        });

                        await newStudent.save();
                        successCount++;

                    } catch (err) {
                        failCount++;
                        errors.push(`Error adding ${row.enrollmentNumber}: ${err.message}`);
                    }
                }

                res.json({
                    message: 'Bulk upload processed',
                    summary: {
                        total: results.length,
                        success: successCount,
                        failed: failCount,
                        errors
                    }
                });
            });

    } catch (error) {
        console.error('Bulk upload error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new student (Admin only - Single)
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
// Get all students (Admin only) - Enhanced with Filters
router.get('/students', auth, isAdmin, async (req, res) => {
    try {
        const { search, department, year, routeId, shift, page = 1, limit = 20 } = req.query;

        const pipeline = [
            { $match: { role: 'student' } },

            // Lookup active bus pass to get route/shift info
            {
                $lookup: {
                    from: 'buspasses',
                    let: { userId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$userId", "$$userId"] },
                                        { $eq: ["$status", "approved"] }
                                    ]
                                }
                            }
                        },
                        { $sort: { createdAt: -1 } },
                        { $limit: 1 }
                    ],
                    as: 'activePass'
                }
            },
            { $unwind: { path: '$activePass', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'routes',
                    localField: 'activePass.route',
                    foreignField: '_id',
                    as: 'routeInfo'
                }
            },
            { $unwind: { path: '$routeInfo', preserveNullAndEmptyArrays: true } },
            {
                $addFields: {
                    // Provide route number at top level for easy access
                    routeNumber: "$routeInfo.routeNumber"
                }
            }
        ];

        // Search Filters
        if (search) {
            pipeline.push({
                $match: {
                    $or: [
                        { enrollmentNumber: { $regex: search, $options: 'i' } },
                        { name: { $regex: search, $options: 'i' } }
                    ]
                }
            });
        }

        if (department) pipeline.push({ $match: { department } });
        if (year) pipeline.push({ $match: { year: parseInt(year) } });

        // Advanced Filters (depend on Active Pass)
        if (routeId) {
            const mongoose = require('mongoose');
            pipeline.push({
                $match: { 'activePass.route': new mongoose.Types.ObjectId(routeId) }
            });
        }

        if (shift) {
            pipeline.push({
                $match: { 'activePass.shift': shift }
            });
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Count total matching
        const countPipeline = [...pipeline, { $count: 'total' }];
        const countResult = await User.aggregate(countPipeline);
        const totalStudents = countResult.length > 0 ? countResult[0].total : 0;

        // Apply sort and pagination to main pipeline
        pipeline.push({ $sort: { createdAt: -1 } });
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: parseInt(limit) });

        // Project final shape
        pipeline.push({
            $project: {
                password: 0,
                __v: 0,
                'activePass.userId': 0,
                'activePass.__v': 0
            }
        });

        const students = await User.aggregate(pipeline);

        res.json({
            students,
            totalPages: Math.ceil(totalStudents / limit),
            currentPage: parseInt(page),
            totalStudents
        });

    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get student details (Admin only)
// Get student details (Admin only) - Enhanced with Logs
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

        // Get recent attendance logs
        const attendanceLogs = await DailyAttendance.find({ userId: req.params.id })
            .populate('routeId', 'routeName routeNumber')
            .sort({ date: -1, checkInTime: -1 })
            .limit(50);

        res.json({
            student,
            passes,
            attendanceLogs
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
                    routeName: route.routeName,
                    routeNumber: route.routeNumber
                };
            })
        );

        res.json(populatedData);
    } catch (error) {
        console.error('Get today attendance error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ===============================
// Bus Management
// ===============================

// Create new bus
router.post('/buses', auth, isAdmin, async (req, res) => {
    try {
        const {
            busNumber,
            registrationNumber,
            capacity,
            manufacturer,
            model,
            yearOfManufacture,
            insuranceExpiryDate,
            fitnessExpiryDate,
            assignedDriver,
            assignedRoute
        } = req.body;

        const newBus = new Bus({
            busNumber,
            registrationNumber,
            capacity,
            manufacturer,
            model,
            yearOfManufacture,
            insuranceExpiryDate,
            fitnessExpiryDate,
            assignedDriver: assignedDriver || null,
            assignedRoute: assignedRoute || null,
            createdBy: req.user._id
        });

        await newBus.save();

        res.status(201).json({ message: 'Bus created successfully', bus: newBus });
    } catch (error) {
        console.error('Create bus error:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});

// Get all buses
router.get('/buses', auth, isAdmin, async (req, res) => {
    try {
        const buses = await Bus.find()
            .populate('assignedDriver', 'name mobile')
            .populate('assignedRoute', 'routeName routeNumber')
            .sort({ createdAt: -1 });
        res.json(buses);
    } catch (error) {
        console.error('Get buses error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update bus
router.put('/buses/:id', auth, isAdmin, async (req, res) => {
    try {
        const updatedBus = await Bus.findByIdAndUpdate(
            req.params.id,
            req.body, { new: true, runValidators: true }
        );
        if (!updatedBus) return res.status(404).json({ message: 'Bus not found' });
        res.json({ message: 'Bus updated successfully', bus: updatedBus });
    } catch (error) {
        console.error('Update bus error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete bus (Soft delete)
router.delete('/buses/:id', auth, isAdmin, async (req, res) => {
    try {
        const bus = await Bus.findById(req.params.id);
        if (!bus) return res.status(404).json({ message: 'Bus not found' });

        bus.status = 'inactive';
        bus.isActive = false;
        await bus.save();

        res.json({ message: 'Bus deactivated successfully' });
    } catch (error) {
        console.error('Delete bus error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ===============================
// Driver Management
// ===============================

// Create new driver
router.post('/drivers', auth, isAdmin, async (req, res) => {
    try {
        const {
            name,
            email,
            mobile,
            password,
            licenseNumber,
            employeeId,
            shift,
            assignedRoute
        } = req.body;

        // Check availability
        const existing = await User.findOne({
            $or: [{ email }, { mobile }, { employeeId }]
        });

        if (existing) {
            return res.status(400).json({ message: 'Driver with this email, mobile or employee ID already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const driver = new User({
            role: 'driver',
            name,
            email,
            mobile,
            password: hashedPassword,
            licenseNumber,
            employeeId,
            shift,
            assignedRoute: assignedRoute || null,
            createdBy: req.user._id
        });

        await driver.save();
        res.status(201).json({ message: 'Driver created successfully', driver });

    } catch (error) {
        console.error('Create driver error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all drivers
router.get('/drivers', auth, isAdmin, async (req, res) => {
    try {
        const drivers = await User.find({ role: 'driver' })
            .select('-password')
            .populate('assignedRoute', 'routeName routeNumber')
            .populate('assignedBus', 'busNumber registrationNumber')
            .sort({ createdAt: -1 });
        res.json(drivers);
    } catch (error) {
        console.error('Get drivers error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update driver & assignments
router.put('/drivers/:id', auth, isAdmin, async (req, res) => {
    try {
        const { assignedBus, ...updateData } = req.body;

        const driver = await User.findByIdAndUpdate(
            req.params.id,
            updateData, { new: true }
        ).select('-password');

        if (!driver) return res.status(404).json({ message: 'Driver not found' });

        // If bus assignment changed, upate the Bus model too
        if (assignedBus) {
            // specific bus assignment logic would go here if needed 
            // for bidirectional link maintenance
            driver.assignedBus = assignedBus;
            await driver.save();

            // Update Bus to point to this driver
            await Bus.findByIdAndUpdate(assignedBus, { assignedDriver: driver._id });
        }

        res.json({ message: 'Driver updated successfully', driver });
    } catch (error) {
        console.error('Update driver error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;