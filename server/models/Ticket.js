const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    ticketNumber: {
        type: String,
        required: true,
        unique: true
    },
    qrCode: {
        type: String,
        required: true
    },
    shift: {
        type: String,
        enum: ['morning', 'afternoon'],
        required: true
    },
    route: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route',
        required: true
    },
    validDate: {
        type: Date,
        required: true
    },
    isUsed: {
        type: Boolean,
        default: false
    },
    usedAt: {
        type: Date
    },
    usedOn: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bus'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
    },
    paymentAmount: {
        type: Number,
        required: true
    },
    paymentId: {
        type: String
    },
    purchaseDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Ticket', ticketSchema);
