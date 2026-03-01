const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
    status: { type: String, required: true },
    remark: { type: String, default: '' },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
}, { _id: false });

const complaintSchema = new mongoose.Schema({
    // Reference number e.g. GUNI-CMP-2603-4821
    referenceNumber: { type: String, unique: true },

    // Complainant
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    studentName: { type: String, required: true },
    enrollmentNumber: { type: String, required: true },
    mobile: { type: String },

    // Complaint details
    category: {
        type: String,
        enum: [
            'bus_late_no_show',
            'driver_behaviour',
            'bus_condition',
            'route_deviation',
            'qr_pass_issue',
            'overcharging',
            'safety_concern',
            'stop_issue',
            'other',
        ],
        required: true,
    },

    title: { type: String, required: true, maxlength: 120 },
    description: { type: String, required: true, maxlength: 2000 },

    // Optional context
    routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', default: null },
    routeName: { type: String, default: '' },
    incidentDate: { type: String, default: '' },   // YYYY-MM-DD
    shift: { type: String, enum: ['morning', 'afternoon', ''], default: '' },

    // Photo attachment (base64 data URL or URL string)
    photo: { type: String, default: '' },

    // Priority auto-set for safety concerns
    priority: { type: String, enum: ['normal', 'high', 'urgent'], default: 'normal' },

    // Status lifecycle
    status: {
        type: String,
        enum: ['pending', 'reviewing', 'resolved', 'rejected'],
        default: 'pending',
    },
    adminRemark: { type: String, default: '' },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: { type: Date, default: null },
    statusHistory: [statusHistorySchema],

    // Student follow-up (legacy single field, kept for migration safety)
    followUp: { type: String, default: '' },

    // Production-level conversation thread
    messages: [{
        senderRole: { type: String, enum: ['student', 'admin'], required: true },
        senderName: { type: String, required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
    }],

}, { timestamps: true });

// Helper: generate reference number (used in route handler)
function generateComplaintRef() {
    const now = new Date();
    const yymm = String(now.getFullYear()).slice(2) + String(now.getMonth() + 1).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `GUNI-CMP-${yymm}-${rand}`;
}

const Complaint = mongoose.model('Complaint', complaintSchema);

module.exports = { Complaint, generateComplaintRef };
