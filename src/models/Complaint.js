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
  district: {
    type: String,
    default: null
  },
  municipalCorp: {
    type: String,
    default: null
  },
  localBodyType: {
    type: String,
    enum: ['Nagar Nigam', 'Nagar Palika Parishad', 'Nagar Panchayat', 'Development Block', 'Gram Panchayat'],
    default: 'Nagar Nigam'
  },
  ward: {
    type: String,
    default: null
  },
  block: {
    type: String,
    default: null
  },
  gramPanchayat: {
    type: String,
    default: null
  },
  localBodyId: {
    type: String,
    default: null,
    index: true
  },
  localBodyName: {
    type: String,
    default: null
  },
  bodyType: {
    type: String,
    default: null
  },
  bodyName: {
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
