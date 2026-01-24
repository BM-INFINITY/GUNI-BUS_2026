const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
    busNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    registrationNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },

    capacity: {
        type: Number,
        required: true,
        min: 10,
        max: 100
    },

    manufacturer: {
        type: String,
        required: true,
        trim: true
    },

    model: {
        type: String,
        required: true,
        trim: true
    },

    yearOfManufacture: {
        type: Number,
        required: true,
        min: 2000,
        max: new Date().getFullYear() + 1
    },

    status: {
        type: String,
        enum: ['active', 'maintenance', 'inactive'],
        default: 'active'
    },

    assignedRoute: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route',
        default: null
    },

    assignedDriver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

    lastMaintenanceDate: {
        type: Date,
        default: null
    },

    nextMaintenanceDate: {
        type: Date,
        default: null
    },

    insuranceExpiryDate: {
        type: Date,
        required: true
    },

    fitnessExpiryDate: {
        type: Date,
        required: true
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    isActive: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true
});

// Index for faster queries
// busSchema.index({ busNumber: 1 });
// busSchema.index({ registrationNumber: 1 });
busSchema.index({ status: 1 });
busSchema.index({ assignedRoute: 1 });

module.exports = mongoose.model('Bus', busSchema);