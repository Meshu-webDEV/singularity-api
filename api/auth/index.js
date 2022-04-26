const router = require('express').Router();
// Routes
const google = require('./Google/google.routes');
const twitch = require('./Twitch/twitch.routes');
const local = require('./Local/local.routes');

router.get('/signout', (req, res) => {
  req.logOut();
  req.session.destroy(() => res.status(200).clearCookie('connect.sid').send());
});

router.use('/google', google);
router.use('/local', local);
router.use('/twitch', twitch);

module.exports = router;
