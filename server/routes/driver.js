const express = require('express');
const router = express.Router();
const { auth, isDriver } = require('../middleware/auth');
const DailyAttendance = require('../models/DailyAttendance');
const RouteAnalytics = require('../models/RouteAnalytics');

router.get('/dashboard', auth, isDriver, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const analytics = await RouteAnalytics.findOne({
      routeId: req.user.assignedRoute,
      date: today
    });

    const driver = await require('../models/User').findById(req.user._id)
      .populate('assignedRoute', 'routeName routeNumber startPoint endPoint')
      .populate('assignedBus', 'busNumber registrationNumber capacity model');

    const passengers = await DailyAttendance.find({
      routeId: req.user.assignedRoute,
      date: today
    }).populate('passId userId');

    res.json({
      driver,
      analytics,
      passengers
    });

  } catch (error) {
    console.error('Driver dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get detailed route info for logged-in driver
router.get('/route-details', auth, isDriver, async (req, res) => {
  try {
    const driver = await require('../models/User').findById(req.user._id);

    if (!driver.assignedRoute) {
      return res.status(404).json({ message: 'No route assigned' });
    }

    const route = await require('../models/Route').findById(driver.assignedRoute);

    if (!route) {
      return res.status(404).json({ message: 'Assigned route not found' });
    }

    res.json(route);
  } catch (error) {
    console.error('Driver route details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
