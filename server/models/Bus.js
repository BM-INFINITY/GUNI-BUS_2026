const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
    busNumber: {
        type: String,
        required: true,
        unique: true
    },
    capacity: {
        type: Number,
        required: true
    },
    currentOccupancy: {
        type: Number,
        default: 0
    },
    shift: {
        type: String,
        enum: ['morning', 'afternoon'],
        required: true
    },
    route: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route',
        required: true
    },
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['active', 'maintenance', 'inactive'],
        default: 'active'
    },
    location: {
        latitude: {
            type: Number
        },
        longitude: {
            type: Number
        },
        lastUpdated: {
            type: Date
        }
    },
    features: [{
        type: String
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Bus', busSchema);
