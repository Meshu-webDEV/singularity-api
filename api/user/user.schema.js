const mongoose = require('mongoose');
const { USER_ORGANIZATION_STATUS } = require('../../lib/constants');
const webhookSchema = require('../webhooks/webhook.schema');
const Schema = mongoose.Schema;

module.exports = new Schema({
  OAuthId: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    sparse: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  strategy: {
    type: String,
    required: true,
    default: 'local',
  },
  displayName: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    required: true,
    default: new Date(),
  },
  active: {
    type: Boolean,
    required: true,
    default: false,
  },
  isDeleted: {
    type: Boolean,
    required: true,
    default: false,
  },
  organization_status: {
    type: Number,
    required: true,
    default: USER_ORGANIZATION_STATUS.DEFAULT,
  },
  organization: {
    type: Schema.Types.ObjectId,
    required: false,
    index: true,
  },
  discordWebhooks: {
    type: [webhookSchema],
    required: false,
    default: [],
  },
});
