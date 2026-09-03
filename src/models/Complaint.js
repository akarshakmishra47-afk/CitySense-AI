const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    default: null
  },
  subcategory: {
    type: String,
    default: null
  },
  severity: {
    type: Number,
    default: null
  },
  urgency: {
    type: String,
    default: null
  },
  durationDays: {
    type: Number,
    default: null
  },
  latitude: {
    type: Number,
    default: null
  },
  longitude: {
    type: Number,
    default: null
  },
  address: {
    type: String,
    default: null
  },
  imageUrl: {
    type: String,
    default: null
  },
  aiSummary: {
    type: String,
    default: null
  },
  status: {
    type: String,
    default: 'submitted',
    enum: ['submitted', 'investigating', 'assigned', 'in_progress', 'resolved', 'escalated']
  },
  clusters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ComplaintCluster'
  }],
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

complaintSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

complaintSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
  }
});

const Complaint = mongoose.model('Complaint', complaintSchema);

module.exports = Complaint;
