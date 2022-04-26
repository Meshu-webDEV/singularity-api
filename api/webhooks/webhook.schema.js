const mongoose = require('mongoose');
const { subtractHoursFromNow } = require('../../lib/dates');
const Schema = mongoose.Schema;

module.exports = new Schema({
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
