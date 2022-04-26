const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sysSchema = new Schema({
  games: {
    type: Array,
  },
});

module.exports = mongoose.model('sys', sysSchema);
