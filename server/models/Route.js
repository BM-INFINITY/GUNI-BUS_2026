const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
    routeName: {
        type: String,
        required: true
    },
    routeNumber: {
        type: String,
        required: true,
        unique: true
    },
    shifts: [{
        shiftType: {
            type: String,
            enum: ['morning', 'afternoon'],
            required: true
        },
        stops: [{
            name: {
                type: String,
                required: true
            },
            coordinates: {
                latitude: {
                    type: Number,
                    required: true
                },
                longitude: {
                    type: Number,
                    required: true
                }
            },
            arrivalTime: {
                type: String,
                required: true
            }
        }]
    }],
    startPoint: {
        type: String,
        required: true
    },
    endPoint: {
        type: String,
        required: true
    },
    semesterCharge: {
        type: Number,
        default: 15000,
        required: true
    },
    ticketPrices: {
        single: { type: Number, default: 50 },
        round: { type: Number, default: 100 }
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Route', routeSchema);
