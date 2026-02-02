const mongoose = require('mongoose');

const tripCheckpointSchema = new mongoose.Schema({
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    routeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route',
        required: true
    },
    busId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bus',
        required: true
    },
    date: {
        type: String, // YYYY-MM-DD
        required: true
    },
    shift: {
        type: String,
        enum: ['morning', 'afternoon'],
        required: true
    },

    checkpoints: {
        shiftStart: {
            odometerReading: Number,
            timestamp: Date,
            location: String
        },
        reachedUniversity: {
            odometerReading: Number,
            timestamp: Date,
            location: String
        },
        leftUniversity: {
            odometerReading: Number,
            timestamp: Date,
            location: String
        },
        reachedHome: {
            odometerReading: Number,
            timestamp: Date,
            location: String
        }
    },

    // Current phase of the trip (controls scanning)
    currentPhase: {
        type: String,
        enum: ['not_started', 'boarding', 'at_university', 'returning', 'completed'],
        default: 'not_started'
    },

    totalKmTraveled: Number,
    tripStatus: {
        type: String,
        enum: ['not_started', 'in_progress', 'completed'],
        default: 'not_started'
    }

}, { timestamps: true });

// Unique constraint - one checkpoint record per driver per date per shift
tripCheckpointSchema.index({ driverId: 1, date: 1, shift: 1 }, { unique: true });

module.exports = mongoose.model('TripCheckpoint', tripCheckpointSchema);
