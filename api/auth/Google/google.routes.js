const router = require('express').Router();
const passport = require('passport');
const { CLIENT, META } = require('../../../lib/configs');
const { errorMessages } = require('../../../lib/constants');

// GET ../api/v1/authenticate/google/
router.get(
  '/',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    failureRedirect: `/${META.API_VERSION}/authenticate/google/failure`,
    successRedirect: `/${META.API_VERSION}/authenticate/google/callback`,
  })
);

// GET ../api/v1/authenticate/google/callback
// prettier-ignore
router.get(
  '/callback',
  passport.authenticate('google', {
    session: true,
    failureRedirect: `/${META.API_VERSION}/authenticate/google/failure`,
    successRedirect: `${CLIENT.URL_ORIGIN}/dashboard`,
  }),
  function (req, res) {
    console.log('=== Google callback endpoint ===');
    res.redirect(`${CLIENT.URL_ORIGIN}/dashboard`);
  }
);

// GET ../api/v1/authenticate/google/failure
router.get('/failure', (req, res, next) => {
  console.log('=== Google twitch ===');
  console.log(req.user);
  req.session.destroy();
  req.logout();
  res.clearCookie('connect.sid');
  return res.redirect(
    `${CLIENT.URL_ORIGIN}/join?error=1&message=${errorMessages.PASSPORT_AUTH_FAILURE}`
  );
});

module.exports = router;
