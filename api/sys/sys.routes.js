const router = require('express').Router();

const { errorMessages } = require('../../lib/constants');
const Sys = require('./sys.model');

// Controllers
const {} = require('./sys.controller');

// GET ../api/v1/sys/
router.get('/', (req, res) => {
  return res.status(200).send('OK');
});

// GET ../api/v1/sys/vars/games
router.get('/vars/games', (req, res) => {
  return res.status(200).json({
    games: ['Apex Legends'],
  });
});

module.exports = router;
