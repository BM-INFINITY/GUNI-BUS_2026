const mongoose = require('mongoose');

const demandForecastSchema = new mongoose.Schema({
    routeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route',
        required: true
    },

    date: {
        type: Date,
        required: true
    },

    // Phase 1: calculated from student YES declarations
    // Phase 2: will be replaced/supplemented by ML model output
    expectedPassengers: {
        type: Number,
        default: 0
    },

    recommendedBuses: {
        type: Number,
        default: 1
    },

    // Filled after the 11:30 PM reconciliation cron
    actualPassengers: {
        type: Number,
        default: 0
    },

    // (actualPassengers / expectedPassengers) * 100, capped at 100
    predictionAccuracy: {
        type: Number,
        default: null
    },

    // ML-readiness: store breakdown for future model training
    yesIntentCount: { type: Number, default: 0 },
    noIntentCount: { type: Number, default: 0 },
    noDeclarationCount: { type: Number, default: 0 },

    // Route capacity at forecast time (snapshot)
    busCapacitySnapshot: { type: Number, default: null },

    generatedAt: { type: Date, default: Date.now },
    reconciledAt: { type: Date, default: null }

}, {
    timestamps: true
});

// Ensure one forecast per route per day
demandForecastSchema.index({ routeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DemandForecast', demandForecastSchema);
