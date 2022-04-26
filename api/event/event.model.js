const { eventStatus } = require('./../../lib/constants');
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const eventSchema = new Schema({
  // client filled initially X
  name: {
    type: String,
    required: true,
    index: 'text',
  },
  // client filled initially X
  datetime: {
    type: Date,
    required: true,
  },
  // client filled initially X
  isPublic: {
    type: Boolean,
    required: true,
  },
  // client filled initially X
  rounds: {
    type: Number,
    required: true,
  },
  // client filled initially X
  pointPerKill: {
    type: Number,
    required: true,
  },
  // client filled initially X
  pointsDistribution: {
    type: [Number],
    required: true,
  },
  // client filled initially X
  teams: {
    type: [Object],
    required: true,
  },
  // client filled initially OR backend auto-fill X
  description: {
    type: String,
    required: false,
    default: '',
  },
  // client filled initially OR backend auto-fill X
  hasPrizepool: {
    type: Boolean,
    required: false,
    default: false,
  },
  // client filled initially OR backend auto-fill X
  shouldCreateTeams: {
    type: Boolean,
    required: false,
    default: false,
  },
  prizepool: {
    type: Number,
    required: false,
    default: 0.0,
  },
  remainingPrizepool: {
    type: Number,
    required: false,
    default: 0.0,
  },
  // client filled initially OR backend auto-fill X
  prizepoolCurrency: {
    type: String,
    required: false,
    default: 'USD',
  },
  // client filled initially OR backend auto-fill X
  prizepoolDistribution: {
    type: [Number],
    required: false,
    default: [],
  },
  // filled on event page(settings)
  lobbyCode: {
    type: String,
    required: false,
    default: '',
  },
  discord_webhooks: [
    {
      type: mongoose.Types.ObjectId,
      ref: 'webhook',
    },
  ],
  // filled on event page(settings)
  notify: {
    type: Boolean,
    required: false,
    default: false,
  },
  // backend auto-fill then updated through event page
  roundsTables: {
    type: [Object],
    required: false,
    default: [],
  },
  // backend auto-fill then updated through event page
  standingsTable: {
    type: Array,
    required: true,
  },
  // backend auto-fill then updated through event page
  currentRound: {
    type: Number,
    required: false,
    default: 0,
  },
  // backend auto-fill OR crud job updated OR updated through event page
  status: {
    type: Number,
    required: false,
    default: eventStatus.UPCOMING,
  },
  // backend auto-fill
  uniqueid: {
    type: String,
    required: true,
  },
  // backend auto-fill
  nightbotUrl: {
    type: String,
    required: false,
    default: '',
  },
  eventUrl: {
    type: String,
    required: false,
    default: '',
  },
  // backend auto-fill
  owner: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
  },
  // backend auto-fill then updated through event page
  isDeleted: {
    type: Boolean,
    required: false,
    default: false,
  },
});

module.exports = mongoose.model('event', eventSchema);
