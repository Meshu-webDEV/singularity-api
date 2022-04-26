const router = require('express').Router();

// Controllers
const { signUp, signIn, isAuthorized } = require('./auth.controller');
const isEmpty = require('lodash.isempty');
const { errorMessages } = require('../../lib/constants');

// GET ../api/v1/auth/
router.get('/', (req, res) => {
  res.json({
    message: 'Apex lobbies 🔥 - GET ../api/v1/auth/',
  });
});

// GET ../api/v1/auth/signup
router.get('/is-authorized', async (req, res) => {
  try {
    const { token, username } = await isAuthorized(req.query.token);

    res.json({
      token,
      username,
    });
  } catch (error) {
    console.log('Error signing up');
    console.log(error);
  }
});

// GET ../api/v1/auth/signup
router.post('/signup', async (req, res, next) => {
  try {
    const { token, username } = await signUp(req.body);

    res.json({
      token,
      username,
    });
  } catch (error) {
    console.log(error);
    return next(new Error(error));
  }
});

// GET ../api/v1/auth/signin
router.post('/signin', async (req, res, next) => {
  try {
    const { token, username } = await signIn(req.body);

    res.json({
      token,
      username,
    });
  } catch (error) {
    console.log(error);
    return next(new Error(error));
  }
});

module.exports = router;
