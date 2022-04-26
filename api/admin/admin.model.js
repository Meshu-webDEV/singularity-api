const mongoose = require('mongoose');
const { DATABASE } = require('../../lib/configs');
const Schema = mongoose.Schema;

// Connection
const adminDatabase = mongoose.createConnection(DATABASE.SINGULARITY_ADMIN, {
  keepAlive: true,
  keepAliveInitialDelay: 8000,
});

const adminSchema = new Schema({
  admin_name: {
    type: String,
    required: true,
    unique: true,
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
  isDeleted: {
    type: Boolean,
    required: true,
    default: false,
  },
});

module.exports = adminDatabase.model('Admin', adminSchema);
