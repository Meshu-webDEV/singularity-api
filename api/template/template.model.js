const mongoose = require('mongoose');
const { subtractHoursFromNow } = require('../../lib/dates');
const Schema = mongoose.Schema;

const templatesSchema = new Schema({
  name: {
    type: String,
    required: true,
    index: 'text',
  },
  visible: {
    type: Object,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  owner: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
  },
  template: {
    type: Object,
    required: true,
  },
  used_options: {
    type: Object,
    required: true,
  },
  uniqueid: {
    type: String,
    required: true,
    index: true,
  },
  used: {
    type: Number,
    required: true,
    default: 0,
  },
  isDeleted: {
    type: Boolean,
    required: false,
    default: false,
  },
});

module.exports = mongoose.model('template', templatesSchema);
