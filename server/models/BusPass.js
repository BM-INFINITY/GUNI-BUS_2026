const mongoose = require('mongoose');

const busPassSchema = new mongoose.Schema({
    referenceNumber: {
        type: String,
        unique: true,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    enrollmentNumber: {
        type: String,
        required: true
    },
    // Student Details (copied from profile for record-keeping)
    studentName: String,
    studentPhoto: String,
    studentEmail: String,
    studentPhone: String,
    studentDepartment: String,
    studentYear: Number,

    passType: {
        type: String,
        default: 'semester'
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'expired'],
        default: 'pending'
    },
    qrCode: {
        type: String
    },
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
    semesterCharge: {
        type: Number,
        default: 15000
    },
    validFrom: {
        type: Date
    },
    validUntil: {
        type: Date
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
    rejectionReason: {
        type: String
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'cash'],
        default: 'pending'
    },
    paymentAmount: {
        type: Number,
        default: 15000
    },
    paymentId: {
        type: String
    },
    renewalHistory: [{
        renewedAt: Date,
        validUntil: Date,
        paymentId: String
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('BusPass', busPassSchema);
