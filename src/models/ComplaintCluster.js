const mongoose = require('mongoose');

const complaintClusterSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  probableRootCause: {
    type: String,
    default: null
  },
  rootCauseConfidence: {
    type: Number,
    default: null
  },
  priorityScore: {
    type: Number,
    default: 0
  },
  severityScore: {
    type: Number,
    default: 0
  },
  impactScore: {
    type: Number,
    default: 0
  },
  frequencyScore: {
    type: Number,
    default: 0
  },
  durationScore: {
    type: Number,
    default: 0
  },
  estimatedAffectedPeople: {
    type: Number,
    default: 0
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  radius: {
    type: Number,
    default: 1.0
  },
  recommendedAction: {
    type: String,
    default: null
  },
  evidence: {
    type: String, // Store JSON string array
    default: null
  },
  status: {
    type: String,
    default: 'investigating',
    enum: ['investigating', 'assigned', 'in_progress', 'resolved']
  },
  complaints: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint'
  }]
}, {
  timestamps: true
});

complaintClusterSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

complaintClusterSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
  }
});

const ComplaintCluster = mongoose.model('ComplaintCluster', complaintClusterSchema);

module.exports = ComplaintCluster;
