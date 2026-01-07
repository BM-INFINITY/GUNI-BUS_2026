const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  enrollmentNumber: {
    type: String,
    required: function () { return this.role === 'student'; },
    unique: true,
    sparse: true
  },
  role: {
    type: String,
    enum: ['student', 'admin', 'driver'],
    default: 'student'
  },
  phone: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: function () { return this.role === 'student'; }
  },
  year: {
    type: Number,
    required: function () { return this.role === 'student'; }
  },
  profilePhoto: {
    type: String, // URL or base64 string
    default: ''
  },
  isProfileComplete: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
