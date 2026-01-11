const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const BusPass = require('../models/BusPass');
const Route = require('../models/Route');
const { auth, isAdmin } = require('../middleware/auth');



// ==========================
// Today Route-wise Summary
// ==========================
router.get('/today-summary', auth, isAdmin, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const summary = await Attendance.aggregate([
            { $match: { date: today } },
            {
                $group: {
                    _id: "$route",
                    totalCheckIns: { 
                        $sum: { $cond: [{ $ifNull: ["$checkInTime", false] }, 1, 0] } 
                    },
                    totalCheckOuts: { 
                        $sum: { $cond: [{ $ifNull: ["$checkOutTime", false] }, 1, 0] } 
                    }
                }
            }
        ]);

        const result = await Route.populate(summary, { path: "_id" });

        res.json(result);
    } catch (error) {
        console.error("Today summary error:", error);
        res.status(500).json({ message: "Server error" });
    }
});


// ==========================
// Students Currently In Bus
// ==========================
router.get('/active-students', auth, isAdmin, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const active = await Attendance.find({
            date: today,
            checkInTime: { $ne: null },
            checkOutTime: null
        })
        .populate('userId', 'name enrollmentNumber department year')
        .populate('route', 'routeName routeNumber');

        res.json(active);
    } catch (error) {
        console.error("Active students error:", error);
        res.status(500).json({ message: "Server error" });
    }
});


// ==========================
// Daily Report (By Date)
// ==========================
router.get('/daily-report', auth, isAdmin, async (req, res) => {
    try {
        const { date } = req.query; // YYYY-MM-DD

        if (!date) {
            return res.status(400).json({ message: "Date required" });
        }

        const report = await Attendance.find({ date })
            .populate('userId', 'name enrollmentNumber department year')
            .populate('route', 'routeName routeNumber');

        res.json(report);
    } catch (error) {
        console.error("Daily report error:", error);
        res.status(500).json({ message: "Server error" });
    }
});


// ==========================
// Route-wise Report
// ==========================
router.get('/route-report/:routeId', auth, isAdmin, async (req, res) => {
    try {
        const { routeId } = req.params;

        const report = await Attendance.find({ route: routeId })
            .populate('userId', 'name enrollmentNumber department year')
            .populate('route', 'routeName routeNumber')
            .sort({ createdAt: -1 });

        res.json(report);
    } catch (error) {
        console.error("Route report error:", error);
        res.status(500).json({ message: "Server error" });
    }
});


module.exports = router;

