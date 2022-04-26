const router = require('express').Router();
const path = require('path');
const { errorMessages } = require('../../lib/constants');
// const {  } = require('../../middlewares');

// Controllers
const { activateAccount } = require('./activate.controller');

// GET ../v1/activate/?KEY=<KEY>
router.get('/', async (req, res, next) => {
  try {
    const { key } = req.query;
    console.log('KEY: ', key);

    const { status } = await activateAccount(key);

    if (status === 'expired')
      return res
        .set(
          'Content-Security-Policy',
          "default-src *; style-src 'self' http://* 'unsafe-inline'; script-src 'self' http://* 'unsafe-inline' 'unsafe-eval'"
        )
        .sendFile(path.join(__dirname, '../../views/expired-activation.html'));

    return res
      .set(
        'Content-Security-Policy',
        "default-src *; style-src 'self' http://* 'unsafe-inline'; script-src 'self' http://* 'unsafe-inline' 'unsafe-eval'"
      )
      .sendFile(path.join(__dirname, '../../views/successful-activation.html'));
  } catch (error) {
    return res
      .set(
        'Content-Security-Policy',
        "default-src *; style-src 'self' http://* 'unsafe-inline'; script-src 'self' http://* 'unsafe-inline' 'unsafe-eval'"
      )
      .sendFile(path.join(__dirname, '../../views/failed-activation.html'));
  }
});

module.exports = router;
