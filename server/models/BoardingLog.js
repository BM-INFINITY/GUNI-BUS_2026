const mongoose = require('mongoose');

const boardingLogSchema = new mongoose.Schema({
    passId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BusPass'
    },
    ticketId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    busId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bus',
        required: true
    },
    shift: {
        type: String,
        enum: ['morning', 'afternoon'],
        required: true
    },
    boardingTime: {
        type: Date,
        default: Date.now
    },
    boardingLocation: {
        type: String
    },
    scannedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    verificationType: {
        type: String,
        enum: ['qr', 'barcode'],
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('BoardingLog', boardingLogSchema);
