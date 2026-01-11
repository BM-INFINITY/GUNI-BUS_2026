const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  enrollmentNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },

  // Profile Data
  name: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: function () { return this.role === 'student'; }
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
  profilePhoto: {
    type: String,
    default: ''
  },

  // Profile Status
  isProfileComplete: {
    type: Boolean,
    default: false
  },
  hasCompletedProfileOnce: {
    type: Boolean,
    default: false
  },

  // Profile Change Request
  profileChangeRequest: {
    requestedChanges: {
      name: String,
      dateOfBirth: Date,
      mobile: String,
      email: String,
      department: String,
      year: Number
    },
    reason: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    requestedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    rejectionReason: String
  },

  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
