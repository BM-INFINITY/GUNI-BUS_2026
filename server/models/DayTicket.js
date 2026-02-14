const mongoose = require('mongoose');

const dayTicketSchema = new mongoose.Schema({
    referenceNumber: {
        type: String,
        unique: true,
        required: true
    },

    // Student Info (copied from profile at purchase time - SAME AS BUS PASS)
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

    // Ticket Details
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
    ticketType: {
        type: String,
        enum: ['single', 'round'],
        required: true
    },

    // Payment fields (SAME AS BUS PASS)
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
    purchaseDate: {
        type: Date,
        default: Date.now
    },

    // Validity (ONE DAY ONLY - 00:00 to 23:59)
    travelDate: {
        type: Date,
        required: true
    },
    validFrom: Date,  // Set to 00:00 of travelDate
    validUntil: Date, // Set to 23:59 of travelDate

    // QR Code (SAME SECURITY AS BUS PASS)
    qrCode: String,

    // Scan tracking (UNIQUE TO DAY TICKET)
    scanCount: {
        type: Number,
        default: 0
    },
    maxScans: {
        type: Number,
        required: true // 1 for single, 2 for round
    },
    scans: [{
        scannedAt: Date,
        scannedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        tripType: {
            type: String,
            enum: ['pickup', 'drop']
        }
    }],

    // Admin creation fields
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Admin who created this ticket
    },
    paymentMethod: {
        type: String,
        enum: ['online', 'cash'],
        default: 'online'
    },
    receiptNumber: String, // For cash payments
    priceOverride: Number, // Custom price if admin overrides
    overrideReason: String, // Reason for price override

    // Status
    status: {
        type: String,
        enum: ['pending', 'active', 'used', 'expired', 'cancelled'],
        default: 'pending'
    }

}, {
    timestamps: true
});

// Index for quick lookups
dayTicketSchema.index({ userId: 1, travelDate: 1 });
dayTicketSchema.index({ referenceNumber: 1 });
dayTicketSchema.index({ status: 1, travelDate: 1 });
// Compound index for duplicate detection (route+shift+date)
dayTicketSchema.index({ userId: 1, route: 1, shift: 1, travelDate: 1 });

module.exports = mongoose.model('DayTicket', dayTicketSchema);
