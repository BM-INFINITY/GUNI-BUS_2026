const mongoose = require('mongoose');

const studentJourneyLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    enrollmentNumber: {
        type: String,
        required: true
    },
    studentName: {
        type: String,
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
    routeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route',
        required: true
    },

    // Journey Status
    journeyStatus: {
        type: String,
        enum: ['not_started', 'in_progress', 'completed', 'absent'],
        default: 'not_started'
    },

    // Journey Phases (Same for both shifts)
    onboarded: {
        time: Date,
        scannedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        attendanceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'DailyAttendance'
        }
    },

    reachedUniversity: {
        time: Date,
        viaCheckpoint: {
            type: Boolean,
            default: true
        }
    },

    leftForHome: {
        time: Date,
        viaCheckpoint: {
            type: Boolean,
            default: true
        }
    },

    reachedHome: {
        time: Date,
        viaCheckpoint: {
            type: Boolean,
            default: true
        }
    },

    // Pass/Ticket Info
    passType: {
        type: String,
        enum: ['bus_pass', 'day_ticket'],
        required: true
    },
    passId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    ticketType: {
        type: String,
        enum: ['single', 'round']
    },

    // Absence Tracking
    expectedToBoard: {
        type: Boolean,
        default: true
    },
    isAbsent: {
        type: Boolean,
        default: false
    },
    absentReason: {
        type: String,
        enum: ['not_boarded', 'system_detected']
    },
    markedAbsentAt: Date,
    markedAbsentBy: {
        type: String,
        default: 'system'
    }

}, { timestamps: true });

// Indexes for performance
studentJourneyLogSchema.index({ userId: 1, date: 1 }, { unique: true });
studentJourneyLogSchema.index({ date: 1, routeId: 1, shift: 1 });
studentJourneyLogSchema.index({ date: 1, journeyStatus: 1 });

module.exports = mongoose.model('StudentJourneyLog', studentJourneyLogSchema);
