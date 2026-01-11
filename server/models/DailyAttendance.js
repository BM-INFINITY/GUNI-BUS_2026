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
        enum: ['checked-in', 'checked-out'],
        default: 'checked-in'
    }

}, { timestamps: true });

dailyAttendanceSchema.index({ passId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyAttendance', dailyAttendanceSchema);
