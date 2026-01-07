const express = require('express');
const router = express.Router();
const Bus = require('../models/Bus');
const { auth, isAdmin, isDriver } = require('../middleware/auth');

// Get all active buses
router.get('/', async (req, res) => {
    try {
        const buses = await Bus.find({ status: 'active' })
            .populate('route')
            .populate('driverId', 'name phone');

        res.json(buses);
    } catch (error) {
        console.error('Get buses error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get specific bus details
router.get('/:id', async (req, res) => {
    try {
        const bus = await Bus.findById(req.params.id)
            .populate('route')
            .populate('driverId', 'name phone');

        if (!bus) {
            return res.status(404).json({ message: 'Bus not found' });
        }

        res.json(bus);
    } catch (error) {
        console.error('Get bus error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get bus location (from tracking API - mock for now)
router.get('/:id/location', async (req, res) => {
    try {
        const bus = await Bus.findById(req.params.id);

        if (!bus) {
            return res.status(404).json({ message: 'Bus not found' });
        }

        // TODO: Integrate with actual tracking system API
        // For now, return stored location
        res.json({
            busId: bus._id,
            busNumber: bus.busNumber,
            location: bus.location
        });
    } catch (error) {
        console.error('Get location error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update occupancy
router.put('/:id/occupancy', auth, isDriver, async (req, res) => {
    try {
        const { occupancy, increment } = req.body;
        const bus = await Bus.findById(req.params.id);

        if (!bus) {
            return res.status(404).json({ message: 'Bus not found' });
        }

        if (increment !== undefined) {
            bus.currentOccupancy += increment ? 1 : -1;
        } else if (occupancy !== undefined) {
            bus.currentOccupancy = occupancy;
        }

        // Ensure occupancy doesn't go negative
        if (bus.currentOccupancy < 0) {
            bus.currentOccupancy = 0;
        }

        // Ensure occupancy doesn't exceed capacity
        if (bus.currentOccupancy > bus.capacity) {
            return res.status(400).json({ message: 'Occupancy cannot exceed bus capacity' });
        }

        await bus.save();

        // Broadcast update via WebSocket (handled in server.js)
        req.app.get('io').emit('bus:occupancy:update', {
            busId: bus._id,
            occupancy: bus.currentOccupancy,
            capacity: bus.capacity
        });

        res.json({ message: 'Occupancy updated', bus });
    } catch (error) {
        console.error('Update occupancy error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add new bus (Admin only)
router.post('/', auth, isAdmin, async (req, res) => {
    try {
        const { busNumber, capacity, shift, routeId, driverId, features } = req.body;

        const existingBus = await Bus.findOne({ busNumber });

        if (existingBus) {
            return res.status(400).json({ message: 'Bus with this number already exists' });
        }

        const bus = new Bus({
            busNumber,
            capacity,
            shift,
            route: routeId,
            driverId,
            features
        });

        await bus.save();

        res.status(201).json({
            message: 'Bus added successfully',
            bus: await bus.populate('route driverId')
        });
    } catch (error) {
        console.error('Add bus error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update bus details (Admin only)
router.put('/:id', auth, isAdmin, async (req, res) => {
    try {
        const { capacity, shift, routeId, driverId, status, features } = req.body;

        const bus = await Bus.findByIdAndUpdate(
            req.params.id,
            { capacity, shift, route: routeId, driverId, status, features },
            { new: true, runValidators: true }
        ).populate('route driverId');

        if (!bus) {
            return res.status(404).json({ message: 'Bus not found' });
        }

        res.json({ message: 'Bus updated successfully', bus });
    } catch (error) {
        console.error('Update bus error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
