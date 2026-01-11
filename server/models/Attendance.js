const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
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
    route: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route',
        required: true
    },
    date: {
        type: String, // YYYY-MM-DD
        required: true
    },
    checkInTime: Date,
    checkOutTime: Date,
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
