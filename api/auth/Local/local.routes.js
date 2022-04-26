const router = require('express').Router();
const { isEmpty } = require('lodash');
const passport = require('passport');
const { CLIENT, META, WEB_SERVER } = require('../../../lib/configs');
const { errorMessages } = require('../../../lib/constants');
const mail = require('../../../lib/mail');
const { createNewUser } = require('./local.controller');
const { findUser } = require('../../user/user.controller');
const {
  newActivationRecord,
  isActivationRecordValid: activationStatus,
} = require('../../activate/activate.controller');

// POST ../api/v1/authenticate/local/signup
router.post('/signup', async (req, res, next) => {
  if (isEmpty(req.body)) return next(new Error(errorMessages.MALFORMED_INFO));
  try {
    const created = await createNewUser(req.body);
    const { _id, email, username } = created.toObject();

    // Initialize a record of uniqueid + the new user _id.
    const key = await newActivationRecord(_id.toString());

    // Send email using sendGrid with an HTML to an endpoint to verify the email.
    await mail.activation(
      email,
      username,
      `${WEB_SERVER.ORIGIN}/${META.API_VERSION}/activate/?key=${key}`,
      'Singularity Email Verification'
    );

    // req.login(created, err => {
    //   if (err) {
    //     console.log(err);
    //     return next(new Error(errorMessages.INTERNAL));
    //   }
    // });
    // Return username
    return res.status(201).json({ username: username });
  } catch (error) {
    console.log(error);
    return next(error);
  }
});

router.post('/signin', function (req, res, next) {
  passport.authenticate('local', function ({ status, user }) {
    console.log('=== /signin Passport Authenticate Callback');
    console.log(status);
    console.log(user);

    if (status === 'inactive')
      return res.redirect(
        `/${
          META.API_VERSION
        }/authenticate/local/failure?userid=${user._id.toString()}`
      );

    if (!user) return next(new Error(errorMessages.INVALID_SIGNIN));

    req.logIn(user, err => {
      if (err) return next(err);

      return res.redirect(`/${META.API_VERSION}/authenticate/local/success`);
    });
  })(req, res, next);
});

// GET ../api/v1/authenticate/local/success
router.get('/success', (req, res) => {
  console.log('=== Success local ===');
  console.log(req.user);
  return res.status(200).send();
});

// GET ../api/v1/authenticate/local/failure
router.get('/failure', async (req, res, next) => {
  try {
    const { userid } = req.query;
    console.log('=== Failure local ===');
    req.session.destroy();
    req.logout();
    res.clearCookie('connect.sid');

    const user = await findUser(userid);

    const activateable = await activationStatus(user._id.toString());
    // prettier-ignore
    if (activateable) return next(new Error(errorMessages.NEEDS_ACTIVATION));

    console.log('=== Not activatable..');

    const { _id, email, username } = user;

    // Initialize a record of uniqueid + the user _id.
    const key = await newActivationRecord(_id.toString());

    // Send email using sendGrid with an HTML to an endpoint to verify the email.
    await mail.activation(
      email,
      username,
      `${WEB_SERVER.ORIGIN}/${META.API_VERSION}/activate/?key=${key}`,
      'Singularity Email Verification (New)'
    );

    return next(new Error(errorMessages.EXPIRED_ACTIVATION));
  } catch (error) {
    // console.log(error);
    return next(new Error(errorMessages.INTERNAL));
  }
});

module.exports = router;
