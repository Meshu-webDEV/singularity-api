const { getEventsCount, getUsersCount } = require('./stats.controller');

const router = require('express').Router();

// Controllers

// Count all created events: GET ../api/v1/stats/
router.get('/events/total', async (req, res, next) => {
  try {
    const total = await getEventsCount();

    return res.json(total);
  } catch (error) {
    console.log(error);
    return next(error);
  }
});
// Count all users: GET ../api/v1/stats/
router.get('/users/total', async (req, res, next) => {
  try {
    const total = await getUsersCount();

    return res.json(total);
  } catch (error) {
    console.log(error);
    return next(error);
  }
});

module.exports = router;
