const mongoose = require('mongoose');
const { subtractHoursFromNow } = require('../../lib/dates');
const Schema = mongoose.Schema;

const webhookSchema = new Schema({
  server: {
    type: String,
    required: true,
  },
  channel: {
    type: String,
    required: true,
  },
  webhookUrl: {
    type: String,
    required: true,
  },
  owner: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  uniqueid: {
    type: String,
    required: true,
  },
  lastPinged: {
    type: Date,
    required: false,
    default: new Date(subtractHoursFromNow(25).toISOString()),
  },
  isDeleted: {
    type: Boolean,
    required: false,
    default: false,
  },
});

module.exports = mongoose.model('webhook', webhookSchema);
