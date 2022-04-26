const { errorMessages } = require('../../lib/constants');
const { newTeam, getAllTeams } = require('./team.controller');

const { _isEmpty } = require('../../lib/validation');

const router = require('express').Router();

// Controllers

// GET ../api/v1/team/
router.get('/', async (req, res, next) => {
  try {
    const teams = await getAllTeams(req.user._id);

    res.json(teams);
  } catch (error) {
    return next(error);
  }
});

// GET ../api/v1/team/new
router.post('/new', async (req, res, next) => {
  if (_isEmpty(req.body)) return next(new Error(errorMessages.MISSING_BODY));

  try {
    const team = await newTeam(req.body, req.user._id);
    return res.json({
      team,
    });
  } catch (error) {
    console.log(error);
    return next(error);
  }
});

module.exports = router;
