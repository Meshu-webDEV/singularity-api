const router = require('express').Router();

const { errorMessages } = require('../../lib/constants');
const { passwordResetLimiter } = require('../../lib/ratelimiting');
const { _isEmpty } = require('../../lib/validation');
const { isAuth, userExist } = require('../../middlewares');
// Controllers
const {
  getUser,
  getOrganizerName,
  editDisplayName,
  resetPassword,
  findUser,
  changePassword,
} = require('./user.controller');

// GET ../api/v1/user/
router.get('/', isAuth, async (req, res, next) => {
  try {
    const user = req.user;
    delete user._id;
    return res.status(200).json(user);
  } catch (error) {
    return next(error);
  }
});

// GET ../api/v1/user/my-profile
router.get('/my-profile', isAuth, async (req, res, next) => {
  try {
    const user = await getUser(req.user._id);
    return res.json(user);
  } catch (error) {
    return next(error);
  }
});

// GET ../api/v1/user/edit-display
router.patch('/edit-display', isAuth, async (req, res, next) => {
  try {
    await editDisplayName(
      req.user._id,
      req.user.username,
      req.body.displayName
    );
    return res.send();
  } catch (error) {
    return next(error);
  }
});

router.get('/organizer-name/:id', async (req, res, next) => {
  const { id } = req.params;

  try {
    const organizerName = await getOrganizerName(id);
    return res.status(200).json({ organizerName: organizerName.username });
  } catch (error) {
    console.log(error);
    return next(error);
  }
});

router.get('/by-id/:id', async (req, res, next) => {
  const { id } = req.params;

  try {
    const user = await findUser(id);
    return res.status(200).json({ user });
  } catch (error) {
    console.log(error);
    return next(error);
  }
});

router.patch('/change-password', async (req, res, next) => {
  if (_isEmpty(req.body)) return next(new Error(errorMessages.MALFORMED_INFO));

  try {
    await changePassword(req.user._id, req.body);

    req.session.destroy();
    req.logout();
    res.clearCookie('connect.sid');

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

router.patch(
  '/reset-password',
  passwordResetLimiter,
  async (req, res, next) => {
    if (_isEmpty(req.body))
      return next(new Error(errorMessages.MALFORMED_INFO));

    try {
      const { email } = req.body;
      // TODO: call resetPassword
      await resetPassword(email);

      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;
