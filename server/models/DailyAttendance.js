const mongoose = require('mongoose');

const dailyAttendanceSchema = new mongoose.Schema({
    passId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BusPass',
        required: true
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    routeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route',
        required: true
    },

    date: {
        type: String, // YYYY-MM-DD
        required: true
    },

    checkInTime: {
        type: Date
    },

    checkOutTime: {
        type: Date
    },

    checkInBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // driver
    },

    checkOutBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    status: {
        type: String,
        enum: ['checked-in', 'checked-out', 'completed'],
        default: 'checked-in'
    },

    // New field to support Morning/Evening logic
    shift: {
        type: String,
        enum: ['morning', 'afternoon'], // Derived from Driver's Shift
        required: true
    },

    // pickup = Going to College, drop = Going Home
    tripType: {
        type: String,
        enum: ['pickup', 'drop'],
        required: true
    }

}, { timestamps: true });

// Unique: One Pickup + One Drop per Student per Day
dailyAttendanceSchema.index({ passId: 1, date: 1, tripType: 1 }, { unique: true });

module.exports = mongoose.model('DailyAttendance', dailyAttendanceSchema);
