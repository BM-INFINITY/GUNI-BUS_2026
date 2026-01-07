const express = require('express');
const router = express.Router();
const Route = require('../models/Route');
const { auth, isAdmin } = require('../middleware/auth');

// Get all routes
router.get('/', async (req, res) => {
    try {
        const routes = await Route.find({ isActive: true });
        res.json(routes);
    } catch (error) {
        console.error('Get routes error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get specific route
router.get('/:id', async (req, res) => {
    try {
        const route = await Route.findById(req.params.id);

        if (!route) {
            return res.status(404).json({ message: 'Route not found' });
        }

        res.json(route);
    } catch (error) {
        console.error('Get route error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create route (Admin only)
router.post('/', auth, isAdmin, async (req, res) => {
    try {
        const { routeName, routeNumber, shifts, startPoint, endPoint } = req.body;

        const existingRoute = await Route.findOne({ routeNumber });

        if (existingRoute) {
            return res.status(400).json({ message: 'Route with this number already exists' });
        }

        const route = new Route({
            routeName,
            routeNumber,
            shifts,
            startPoint,
            endPoint
        });

        await route.save();

        res.status(201).json({ message: 'Route created successfully', route });
    } catch (error) {
        console.error('Create route error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update route (Admin only)
router.put('/:id', auth, isAdmin, async (req, res) => {
    try {
        const { routeName, shifts, startPoint, endPoint, isActive } = req.body;

        const route = await Route.findByIdAndUpdate(
            req.params.id,
            { routeName, shifts, startPoint, endPoint, isActive },
            { new: true, runValidators: true }
        );

        if (!route) {
            return res.status(404).json({ message: 'Route not found' });
        }

        res.json({ message: 'Route updated successfully', route });
    } catch (error) {
        console.error('Update route error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete route (Admin only)
router.delete('/:id', auth, isAdmin, async (req, res) => {
    try {
        const route = await Route.findByIdAndDelete(req.params.id);

        if (!route) {
            return res.status(404).json({ message: 'Route not found' });
        }

        res.json({ message: 'Route deleted successfully' });
    } catch (error) {
        console.error('Delete route error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
