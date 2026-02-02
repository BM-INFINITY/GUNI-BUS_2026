const express = require('express');
const router = express.Router();
const TripCheckpoint = require('../models/TripCheckpoint');
const StudentJourneyLog = require('../models/StudentJourneyLog');
const { auth, isDriver } = require('../middleware/auth');
const { getTodayString } = require('../utils/timeProvider');

/**
 * GET /api/checkpoints/status
 * Get current checkpoint status for driver
 */
router.get('/status', auth, isDriver, async (req, res) => {
    try {
        const driver = req.user;
        const todayStr = getTodayString();

        const checkpoint = await TripCheckpoint.findOne({
            driverId: driver._id,
            date: todayStr,
            shift: driver.shift
        });

        if (!checkpoint) {
            return res.json({
                exists: false,
                currentPhase: 'not_started',
                message: 'Please start your shift'
            });
        }

        // Count students onboarded
        const studentCount = await StudentJourneyLog.countDocuments({
            date: todayStr,
            routeId: driver.assignedRoute,
            shift: driver.shift,
            'onboarded.time': { $exists: true }
        });

        res.json({
            exists: true,
            checkpoint,
            currentPhase: checkpoint.currentPhase,
            studentCount,
            canScan: checkpoint.currentPhase === 'boarding' || checkpoint.currentPhase === 'returning'
        });

    } catch (error) {
        console.error('Error fetching checkpoint status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * POST /api/checkpoints/start-shift
 * Start shift and enable boarding scans
 */
router.post('/start-shift', auth, isDriver, async (req, res) => {
    try {
        const { odometerReading } = req.body;
        const driver = req.user;
        const todayStr = getTodayString();

        if (!odometerReading || odometerReading <= 0) {
            return res.status(400).json({ message: 'Valid odometer reading required' });
        }

        // Check if shift already started
        const existing = await TripCheckpoint.findOne({
            driverId: driver._id,
            date: todayStr,
            shift: driver.shift
        });

        if (existing) {
            return res.status(400).json({ message: 'Shift already started' });
        }

        // Create checkpoint
        const checkpoint = await TripCheckpoint.create({
            driverId: driver._id,
            routeId: driver.assignedRoute,
            busId: driver.assignedBus,
            date: todayStr,
            shift: driver.shift,
            checkpoints: {
                shiftStart: {
                    odometerReading,
                    timestamp: new Date()
                }
            },
            currentPhase: 'boarding',
            tripStatus: 'in_progress'
        });

        res.json({
            message: 'Shift started successfully. You can now scan students.',
            checkpoint,
            currentPhase: 'boarding'
        });

    } catch (error) {
        console.error('Error starting shift:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * POST /api/checkpoints/reached-university
 * Mark reached university and update ALL students
 */
router.post('/reached-university', auth, isDriver, async (req, res) => {
    try {
        const { odometerReading } = req.body;
        const driver = req.user;
        const todayStr = getTodayString();

        if (!odometerReading || odometerReading <= 0) {
            return res.status(400).json({ message: 'Valid odometer reading required' });
        }

        const checkpoint = await TripCheckpoint.findOne({
            driverId: driver._id,
            date: todayStr,
            shift: driver.shift
        });

        if (!checkpoint) {
            return res.status(400).json({ message: 'Please start your shift first' });
        }

        if (checkpoint.currentPhase !== 'boarding') {
            return res.status(400).json({ message: 'Invalid phase. Expected: boarding' });
        }

        // Validate odometer is increasing
        const lastReading = checkpoint.checkpoints.shiftStart.odometerReading;
        if (odometerReading <= lastReading) {
            return res.status(400).json({
                message: `Odometer must be greater than ${lastReading} km`
            });
        }

        // Update checkpoint
        checkpoint.checkpoints.reachedUniversity = {
            odometerReading,
            timestamp: new Date()
        };
        checkpoint.currentPhase = 'at_university';
        await checkpoint.save();

        // Update ALL students who boarded
        const result = await StudentJourneyLog.updateMany(
            {
                date: todayStr,
                routeId: driver.assignedRoute,
                shift: driver.shift,
                'onboarded.time': { $exists: true }
            },
            {
                $set: {
                    'reachedUniversity.time': new Date(),
                    'reachedUniversity.viaCheckpoint': true
                }
            }
        );

        res.json({
            message: 'Reached university. Scanning disabled.',
            checkpoint,
            currentPhase: 'at_university',
            studentsUpdated: result.modifiedCount
        });

    } catch (error) {
        console.error('Error marking reached university:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * POST /api/checkpoints/start-return
 * Start return trip and enable return scans
 */
router.post('/start-return', auth, isDriver, async (req, res) => {
    try {
        const { odometerReading } = req.body;
        const driver = req.user;
        const todayStr = getTodayString();

        if (!odometerReading || odometerReading <= 0) {
            return res.status(400).json({ message: 'Valid odometer reading required' });
        }

        const checkpoint = await TripCheckpoint.findOne({
            driverId: driver._id,
            date: todayStr,
            shift: driver.shift
        });

        if (!checkpoint) {
            return res.status(400).json({ message: 'Please start your shift first' });
        }

        if (checkpoint.currentPhase !== 'at_university') {
            return res.status(400).json({ message: 'Invalid phase. Expected: at_university' });
        }

        // Validate odometer is increasing
        const lastReading = checkpoint.checkpoints.reachedUniversity.odometerReading;
        if (odometerReading < lastReading) {
            return res.status(400).json({
                message: `Odometer must be at least ${lastReading} km`
            });
        }

        // Update checkpoint
        checkpoint.checkpoints.leftUniversity = {
            odometerReading,
            timestamp: new Date()
        };
        checkpoint.currentPhase = 'returning';
        await checkpoint.save();

        res.json({
            message: 'Return trip started. You can now scan students.',
            checkpoint,
            currentPhase: 'returning'
        });

    } catch (error) {
        console.error('Error starting return trip:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * POST /api/checkpoints/reached-home
 * Mark reached home and update ALL students
 */
router.post('/reached-home', auth, isDriver, async (req, res) => {
    try {
        const { odometerReading } = req.body;
        const driver = req.user;
        const todayStr = getTodayString();

        if (!odometerReading || odometerReading <= 0) {
            return res.status(400).json({ message: 'Valid odometer reading required' });
        }

        const checkpoint = await TripCheckpoint.findOne({
            driverId: driver._id,
            date: todayStr,
            shift: driver.shift
        });

        if (!checkpoint) {
            return res.status(400).json({ message: 'Please start your shift first' });
        }

        if (checkpoint.currentPhase !== 'returning') {
            return res.status(400).json({ message: 'Invalid phase. Expected: returning' });
        }

        // Validate odometer is increasing
        const lastReading = checkpoint.checkpoints.leftUniversity.odometerReading;
        if (odometerReading <= lastReading) {
            return res.status(400).json({
                message: `Odometer must be greater than ${lastReading} km`
            });
        }

        // Update checkpoint
        checkpoint.checkpoints.reachedHome = {
            odometerReading,
            timestamp: new Date()
        };
        checkpoint.currentPhase = 'completed';
        checkpoint.tripStatus = 'completed';

        // Calculate total KM
        const startKm = checkpoint.checkpoints.shiftStart.odometerReading;
        checkpoint.totalKmTraveled = odometerReading - startKm;

        await checkpoint.save();

        // Update ALL students who left for home
        const result = await StudentJourneyLog.updateMany(
            {
                date: todayStr,
                routeId: driver.assignedRoute,
                shift: driver.shift,
                'leftForHome.time': { $exists: true }
            },
            {
                $set: {
                    'reachedHome.time': new Date(),
                    'reachedHome.viaCheckpoint': true,
                    'journeyStatus': 'completed'
                }
            }
        );

        res.json({
            message: 'Trip completed successfully!',
            checkpoint,
            currentPhase: 'completed',
            totalKmTraveled: checkpoint.totalKmTraveled,
            studentsUpdated: result.modifiedCount
        });

    } catch (error) {
        console.error('Error marking reached home:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
