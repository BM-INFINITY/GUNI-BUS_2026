const express = require('express');
const router = express.Router();
const { getCurrentShift } = require('../utils/helpers');

// Get current shift based on time
router.get('/current', (req, res) => {
    try {
        const currentShift = getCurrentShift();
        const currentHour = new Date().getHours();

        res.json({
            shift: currentShift,
            currentTime: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
            morningShift: '8:30 AM - 2:10 PM',
            afternoonShift: '11:40 AM - 5:20 PM'
        });
    } catch (error) {
        console.error('Get current shift error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all shift timings
router.get('/', (req, res) => {
    try {
        res.json({
            shifts: [
                {
                    name: 'morning',
                    startTime: '08:30',
                    endTime: '14:10',
                    displayTime: '8:30 AM - 2:10 PM'
                },
                {
                    name: 'afternoon',
                    startTime: '11:40',
                    endTime: '17:20',
                    displayTime: '11:40 AM - 5:20 PM'
                }
            ]
        });
    } catch (error) {
        console.error('Get shifts error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
