const router = require('express').Router();
const passport = require('passport');
const { CLIENT, META } = require('../../../lib/configs');
const { errorMessages } = require('../../../lib/constants');

// GET ../api/v1/authenticate/twitch/
router.get(
  '/',
  passport.authenticate('twitch', {
    session: true,
    failureRedirect: `/${META.API_VERSION}/authenticate/twitch/failure`,
  })
);

// GET ../api/v1/authenticate/twitch/callback
// prettier-ignore
router.get(
  '/callback',
  passport.authenticate('twitch', {
    session: true,
    failureRedirect: `/${META.API_VERSION}/authenticate/twitch/failure`,
  }),
  function (req, res) {
    console.log('=== Twitch callback endpoint ===');
    res.redirect(`${CLIENT.URL_ORIGIN}/dashboard`);
  }
);

// GET ../api/v1/authenticate/twitch/failure
router.get('/failure', (req, res, next) => {
  console.log('=== Failure twitch ===');
  console.log(req.user);
  req.session.destroy();
  req.logout();
  res.clearCookie('connect.sid');
  return res.redirect(
    `${CLIENT.URL_ORIGIN}/join?error=1&message=${errorMessages.PASSPORT_AUTH_TWITCH_FAILURE}`
  );
});

module.exports = router;
