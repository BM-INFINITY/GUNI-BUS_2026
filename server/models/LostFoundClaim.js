const mongoose = require('mongoose');

const lostFoundClaimSchema = new mongoose.Schema({
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LostFoundItem',
        required: true
    },

    claimedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // When the student believes they lost it
    lostDate: {
        type: Date,
        required: true
    },

    // Route the student recalls travelling
    busRouteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route',
        default: null
    },

    // Student's ownership proof text
    ownershipProof: {
        type: String,
        required: true,
        trim: true
    },

    // Optional image for proof
    proofImageBase64: {
        type: String,
        default: null
    },

    // Unique identifiers student provides
    identifyingDetails: {
        type: String,
        required: true,
        trim: true
    },

    // Admin review status
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'MORE_INFO_REQUESTED'],
        default: 'PENDING'
    },

    // Admin note (rejection reason / info request)
    adminNote: {
        type: String,
        default: ''
    },

    // Populated when admin approves and records handover
    handoverDate: {
        type: Date,
        default: null
    },

    handoverRecordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }

}, {
    timestamps: true
});

// Prevent duplicate claims from same student for same item
lostFoundClaimSchema.index({ itemId: 1, claimedBy: 1 }, { unique: true });
lostFoundClaimSchema.index({ status: 1 });
lostFoundClaimSchema.index({ claimedBy: 1 });

module.exports = mongoose.model('LostFoundClaim', lostFoundClaimSchema);
