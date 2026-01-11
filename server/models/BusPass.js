const mongoose = require('mongoose');

const busPassSchema = new mongoose.Schema({
    referenceNumber: {
        type: String,
        unique: true,
        required: true
    },

    // Student Info (copied from profile at application time)
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
    studentPhoto: String,
    dateOfBirth: {
        type: Date,
        required: true
    },
    mobile: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    year: {
        type: Number,
        required: true
    },

    // Pass Details
    route: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route',
        required: true
    },
    selectedStop: {
        type: String,
        required: true
    },
    shift: {
        type: String,
        enum: ['morning', 'afternoon'],
        required: true
    },

    // Status
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    // Payment fields
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    paymentFailureReason: String,
    
    razorpayOrderId: {
        type: String
    },
    razorpayPaymentId: {
        type: String
    },
    amount: {
        type: Number,
        required: true
    },
    applicationDate: {
        type: Date,
        default: Date.now
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvedAt: {
        type: Date
    },
    rejectionReason: String,

    // Validity (set when approved)
    validFrom: Date,
    validUntil: Date,
    qrCode: String

}, {
    timestamps: true
});

module.exports = mongoose.model('BusPass', busPassSchema);
