const mongoose = require('mongoose');

const seatReservationSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    busId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bus',
        required: true
    },

    routeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route',
        required: true
    },

    // Travel date (date only, normalized to midnight UTC)
    date: {
        type: Date,
        required: true
    },

    // Which leg of the trip
    direction: {
        type: String,
        enum: ['home_to_uni', 'uni_to_home'],
        required: true
    },

    // The actual seat number (1, 2, 3 ... capacity)
    seatNumber: {
        type: Number,
        required: true,
        min: 1
    },

    // What kind of booking was made (for UI display purposes)
    tripType: {
        type: String,
        enum: ['one_way', 'round_trip', 'multi_day'],
        required: true
    },

    // Reward points deducted for this reservation
    pointsSpent: {
        type: Number,
        required: true,
        min: 0
    },

    status: {
        type: String,
        enum: ['active', 'cancelled'],
        default: 'active'
    },

    cancelledAt: {
        type: Date,
        default: null
    }

}, {
    timestamps: true
});

// One seat per bus per date per direction (prevents double-booking)
seatReservationSchema.index(
    { busId: 1, date: 1, direction: 1, seatNumber: 1 },
    { unique: true, partialFilterExpression: { status: 'active' } }
);

// Fast lookup for a student's reservations
seatReservationSchema.index({ studentId: 1, date: 1 });

// Fast lookup for admin/driver queries
seatReservationSchema.index({ busId: 1, date: 1 });

module.exports = mongoose.model('SeatReservation', seatReservationSchema);
