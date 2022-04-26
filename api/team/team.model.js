const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const teamSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  uniqueid: {
    type: String,
    required: true,
  },
  creator: {
    type: String,
    required: true,
  },
  players: {
    type: [String],
    required: false,
    default: [],
  },
  creatable: {
    type: Boolean,
    required: false,
    default: false,
  },
  isDeleted: {
    type: Boolean,
    required: false,
    default: false,
  },
});

module.exports = mongoose.model('team', teamSchema);
