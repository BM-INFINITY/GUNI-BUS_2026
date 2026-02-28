const mongoose = require('mongoose');

const lostReportSchema = new mongoose.Schema({
    // Who reported it
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // What was lost
    itemName: {
        type: String,
        required: true,
        trim: true
    },

    category: {
        type: String,
        enum: ['id_card', 'bag', 'electronics', 'clothing', 'documents', 'water_bottle', 'other'],
        default: 'other'
    },

    description: {
        type: String,
        default: ''
    },

    // When & where
    lostDate: {
        type: Date,
        required: true
    },

    busRouteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route',
        default: null
    },

    // Identifying details
    identifyingDetails: {
        type: String,
        required: true
    },

    // Noticeboard status
    status: {
        type: String,
        enum: ['ACTIVE', 'ADMIN_FOUND', 'RESOLVED'],
        default: 'ACTIVE'
    },

    // Whether students can still comment on it
    isChatEnabled: {
        type: Boolean,
        default: true
    },

    // If admin matches this to a found item
    matchedItemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LostFoundItem',
        default: null
    },

    // Step 2: Item found and secured by Admin at depot
    adminFoundDetails: {
        foundBy: { type: String, default: null }, // Driver/Admin who found it
        location: { type: String, default: null },
        note: { type: String, default: null },
        date: { type: Date, default: null }
    },

    // Step 3: Item collected by Owner
    handoverDetails: {
        handoverTo: { type: String, default: null },
        note: { type: String, default: null },
        date: { type: Date, default: null }
    }

}, { timestamps: true });

// Index for efficient filtering
lostReportSchema.index({ reportedBy: 1, createdAt: -1 });
lostReportSchema.index({ status: 1 });
lostReportSchema.index({ busRouteId: 1, lostDate: -1 });

module.exports = mongoose.model('LostReport', lostReportSchema);
