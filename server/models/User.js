const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  enrollmentNumber: {
    type: String,
    required: function () { return this.role === 'student'; },
    unique: true,
    sparse: true,
    trim: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ['student', 'admin', 'driver'],
    default: 'student'
  },

  // Common Profile
  name: {
    type: String,
    required: true,
    trim: true
  },

  mobile: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },

  // Student Only
  dateOfBirth: {
    type: Date,
    required: function () { return this.role === 'student'; }
  },

  department: {
    type: String,
    required: function () { return this.role === 'student'; }
  },

  year: {
    type: Number,
    required: function () { return this.role === 'student'; },
    min: 1,
    max: 4
  },

  // Driver Only
  employeeId: {
    type: String,
    required: function () { return this.role === 'driver'; },
    unique: true,
    sparse: true
  },

  licenseNumber: {
    type: String,
    required: function () { return this.role === 'driver'; }
  },

  assignedRoute: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route'
  },

  assignedBus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus'
  },

  shift: {
    type: String,
    enum: ['morning', 'afternoon']
  },

  // Profile Management
  profilePhoto: {
    type: String, // Base64 encoded image
    default: null
  },

  isProfileComplete: {
    type: Boolean,
    default: false
  },

  hasCompletedProfileOnce: {
    type: Boolean,
    default: false
  },
  isAutoCreated: {
    type: Boolean,
    default: false
  },
  mustChangePassword: {
    type: Boolean,
    default: false
  },

  // Profile Management
  profileChangeRequest: {
    requestedChanges: {
      type: Object,
      default: null
    },
    reason: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: null
    },
    requestedAt: Date,
    reviewedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rejectionReason: String
  },

  isActive: {
    type: Boolean,
    default: true
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Ride Intent Reward System
  rewardPoints: {
    type: Number,
    default: 0,
    min: 0
  },

  reliabilityScore: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  }

}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
