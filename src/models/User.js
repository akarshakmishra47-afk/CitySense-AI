const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    default: 'citizen',
    enum: ['citizen', 'admin_ward', 'admin_city', 'admin_state']
  },
  state: {
    type: String,
    default: null
  },
  municipalCorp: {
    type: String,
    default: null
  },
  ward: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Create a virtual property `id` that maps to `_id` for compatibility
userSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Ensure virtuals are included when converting to JSON
userSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
