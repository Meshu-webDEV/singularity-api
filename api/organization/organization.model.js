const mongoose = require('mongoose');
const { orgApplicationStatus } = require('../../lib/constants');
const Schema = mongoose.Schema;

const organizationSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  about: {
    type: String,
    required: false,
  },
  website: {
    type: String,
    required: false,
  },
  twitch: {
    type: String,
    required: false,
  },
  twitter: {
    type: String,
    required: false,
  },
  discord: {
    type: String,
    required: false,
  },
  avatar: {
    type: String,
    required: false,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  uniqueid: {
    type: String,
    required: true,
    index: true,
  },
  createdAt: {
    type: Date,
    required: false,
    default: new Date(),
  },
  status: {
    type: Number,
    required: true,
    default: orgApplicationStatus.PENDING,
  },
  rejection_reason: {
    type: String,
    required: false,
  },
  isDeleted: {
    type: Boolean,
    required: false,
    default: false,
  },
});

module.exports = mongoose.model('organization', organizationSchema);
