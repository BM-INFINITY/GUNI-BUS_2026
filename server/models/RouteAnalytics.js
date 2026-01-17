const mongoose = require('mongoose');

const routeAnalyticsSchema = new mongoose.Schema({
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: true
  },

  date: {
    type: String, // YYYY-MM-DD
    required: true
  },

  // SEPARATE STATS FOR SHIFT 1 vs SHIFT 2
  shift: {
    type: String,
    enum: ['morning', 'afternoon'],
    required: true
  },

  totalPassengers: {
    type: Number,
    default: 0
  },

  checkedIn: {
    type: Number,
    default: 0
  },

  checkedOut: {
    type: Number,
    default: 0
  },

  busId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus'
  }
}, {
  timestamps: true
});

// Unique stats per ROUTE + DATE + SHIFT
routeAnalyticsSchema.index({ routeId: 1, date: 1, shift: 1 }, { unique: true });

module.exports = mongoose.model('RouteAnalytics', routeAnalyticsSchema);

routeAnalyticsSchema.index({ routeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('RouteAnalytics', routeAnalyticsSchema);
