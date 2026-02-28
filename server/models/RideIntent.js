const mongoose = require('mongoose');

const rideIntentSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    routeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route',
        required: true
    },

    travelDate: {
        type: Date,
        required: true
    },

    intentStatus: {
        type: String,
        enum: ['YES', 'NO'],
        required: true
    },

    submittedAt: {
        type: Date,
        default: Date.now
    },

    // Filled in by end-of-day cron (11:30 PM)
    actualBoarded: {
        type: Boolean,
        default: false
    },

    rewardPointsCalculated: {
        type: Boolean,
        default: false
    },

    // +10, +5, -8, or 0 — recorded for audit trail
    reliabilityScoreImpact: {
        type: Number,
        default: 0
    },

    // ML-ready field: Phase 2 can read this to build training data
    mlFeatures: {
        dayOfWeek: { type: Number },
        month: { type: Number },
        consecutiveAbsences: { type: Number, default: 0 }
    }

}, {
    timestamps: true
});

// Ensure one declaration per student per day
rideIntentSchema.index({ studentId: 1, travelDate: 1 }, { unique: true });

// Fast aggregation for forecast generation
rideIntentSchema.index({ routeId: 1, travelDate: 1 });

module.exports = mongoose.model('RideIntent', rideIntentSchema);
