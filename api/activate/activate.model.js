const mongoose = require('mongoose');
const { Types } = require('mongoose');
const Schema = mongoose.Schema;

const activateSchema = new Schema({
  userid: {
    type: Types.ObjectId,
    required: true,
    unique: true,
  },
  activation_key: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    expires: 1000 * 60 * 60 * 24, // 1 day
    required: true,
    default: new Date(),
  },
});

module.exports = mongoose.model('Activation', activateSchema);
