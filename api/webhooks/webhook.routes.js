const router = require('express').Router();

const { errorMessages } = require('../../lib/constants');
const { _isEmpty } = require('../../lib/validation');
const { isAuth, userExist, hookExist } = require('../../middlewares');
// Controllers
const {
  newDiscordWebhook,
  getDiscordWebhooks,
  pingDiscordChannel,
  getDiscordWebhookById,
  deleteDiscordWebhookById,
  updateDiscordWebhookById,
} = require('./webhook.controller');

// GET ../api/v1/webhooks/?[ids]
router.get('/by-ids', userExist, async (req, res, next) => {
  try {
    const { ids } = req.query;
    if (!ids?.length) throw new Error(errorMessages.MALFORMED_INFO);

    const discordWebhooks = await getDiscordWebhookById(req.user._id, ids);

    res.json(discordWebhooks);
  } catch (error) {
    console.log(error);
    return next(error);
  }
});

// GET ../api/v1/webhooks/
router.get('/', userExist, async (req, res, next) => {
  try {
    const discordWebhooks = await getDiscordWebhooks(req.user._id);

    res.json(discordWebhooks);
  } catch (error) {
    console.log(error);
    return next(error);
  }
});

// GET ../api/v1/webhooks/:id
router.get('/:id', userExist, async (req, res, next) => {
  if (_isEmpty(req.params)) return next(new Error(errorMessages.MISSING_BODY));

  try {
    const { id } = req.params;

    const discordWebhook = await getDiscordWebhookById(req.user._id, id);

    res.json(discordWebhook);
  } catch (error) {
    console.log(error);
    return next(error);
  }
});

// DELETE ../api/v1/webhooks/:id
router.delete('/:id', userExist, hookExist, async (req, res, next) => {
  if (_isEmpty(req.params)) return next(new Error(errorMessages.MISSING_BODY));

  try {
    const { id } = req.params;

    await deleteDiscordWebhookById(req.user._id, id);

    res.status(200).send();
  } catch (error) {
    console.log(error);
    return next(error);
  }
});

// PATCH ../api/v1/webhook/:id
router.patch('/:id', userExist, async (req, res, next) => {
  if (_isEmpty(req.body)) return next(new Error(errorMessages.MISSING_BODY));

  try {
    const { id } = req.params;
    const { channel, server, webhookUrl } = req.body;

    await updateDiscordWebhookById(req.user._id, id, {
      channel,
      server,
      webhookUrl,
    });

    res.status(200).send();
  } catch (error) {
    console.log(error);
    return next(error);
  }
});

// POST ../api/v1/webhook/new
router.post('/new', userExist, async (req, res, next) => {
  if (_isEmpty(req.body)) return next(new Error(errorMessages.MISSING_BODY));

  try {
    const uniqueid = await newDiscordWebhook(req.user._id, req.body);

    res.json({ uniqueid });
  } catch (error) {
    console.log(error);
    return next(error);
  }
});

// POST ../api/v1/webhooks/:id/ping
router.post(
  '/:id/ping',
  isAuth,
  userExist,
  hookExist,
  async (req, res, next) => {
    if (_isEmpty(req.params))
      return next(new Error(errorMessages.MISSING_BODY));

    try {
      const { id } = req.params;
      const channel = await pingDiscordChannel(req.user._id, id);

      res.json(channel);
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }
);

module.exports = router;
