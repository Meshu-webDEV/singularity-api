const mongoose = require('mongoose');
const Schema = mongoose.Schema;

module.exports = new Schema({
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
  twitter: {
    type: String,
    required: false,
  },
  instagram: {
    type: String,
    required: false,
  },
  twitch: {
    type: String,
    required: false,
  },
  discord: {
    type: String,
    required: false,
  },
  facebook: {
    type: String,
    required: false,
  },
  other: {
    type: String,
    required: false,
  },
  avatar: {
    type: String,
    required: false,
  },
  uniqueid: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    required: false,
    default: new Date(),
  },
  isDeleted: {
    type: Boolean,
    required: false,
    default: false,
  },
});
