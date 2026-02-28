const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    action: { type: String, required: true },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    at: { type: Date, default: Date.now },
    note: { type: String, default: '' }
}, { _id: false });

const lostFoundItemSchema = new mongoose.Schema({
    itemName: {
        type: String,
        required: true,
        trim: true
    },

    category: {
        type: String,
        enum: ['id_card', 'bag', 'electronics', 'clothing', 'documents', 'water_bottle', 'other'],
        required: true
    },

    description: {
        type: String,
        required: true,
        trim: true
    },

    // Who found it
    foundBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Auto-linked from driver's assignment
    busId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bus',
        default: null
    },

    routeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route',
        default: null
    },

    foundDate: {
        type: Date,
        required: true
    },

    // Base64 image (same pattern as User.profilePhoto)
    imageBase64: {
        type: String,
        default: null
    },

    // Logical storage tracking (no complex inventory)
    storageLocation: {
        location: { type: String, default: '' }, // e.g. "Depot", "Main Office"
        rack: { type: String, default: '' },      // e.g. "Rack A"
        box: { type: String, default: '' }        // e.g. "Box 3"
    },

    // Noticeboard status
    status: {
        type: String,
        enum: ['ACTIVE', 'RESOLVED'],
        default: 'ACTIVE'
    },

    // Whether students can still comment on it
    isChatEnabled: {
        type: Boolean,
        default: true
    },

    // Step 3: Item collected by Owner
    handoverDetails: {
        handoverTo: { type: String, default: null },
        note: { type: String, default: null },
        date: { type: Date, default: null }
    },

    // Append-only audit trail — no deletions allowed
    auditLog: {
        type: [auditLogSchema],
        default: []
    },

    // Auto-set 30 days after foundDate; cron job can mark EXPIRED
    expiryDate: {
        type: Date,
        default: null
    },



}, {
    timestamps: true
});

// Indexes for common query patterns
lostFoundItemSchema.index({ status: 1 });
lostFoundItemSchema.index({ routeId: 1 });
lostFoundItemSchema.index({ category: 1 });
lostFoundItemSchema.index({ foundDate: -1 });
lostFoundItemSchema.index({ foundBy: 1 });

module.exports = mongoose.model('LostFoundItem', lostFoundItemSchema);
