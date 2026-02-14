const mongoose = require('mongoose');

const allowedBookingDaysSchema = new mongoose.Schema({
    route: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route',
        required: false // Optional - if null, applies to ALL routes
    },
    date: {
        type: Date,
        required: true
    },
    mode: {
        type: String,
        enum: ['enable', 'disable'], // 'enable' = allow booking, 'disable' = block booking
        default: 'enable'
    },
    allowedShifts: [{
        type: String,
        enum: ['morning', 'afternoon'],
        required: true
    }],
    reason: {
        type: String,
        default: 'Admin override'
    },
    enabledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Indexes for fast lookups
allowedBookingDaysSchema.index({ route: 1, date: 1 });
allowedBookingDaysSchema.index({ date: 1 });

module.exports = mongoose.model('AllowedBookingDays', allowedBookingDaysSchema);
