const RateLimit = require('express-rate-limit');
const redis = require('redis');
const RedisStore = require('rate-limit-redis');
const { REDIS, WEB_SERVER } = require('./configs');
const { errorMessages } = require('./constants');

const {
  hostname: rtgHost,
  port: rtgPort,
  password: rtgPassword,
  username: rtgUsername,
} = WEB_SERVER.ENV === 'production' ? new URL(process.env.REDISTOGO_URL) : {};

const redisClient =
  WEB_SERVER.ENV === 'production'
    ? redis.createClient(rtgPort, rtgHost)
    : redis.createClient();

if (WEB_SERVER.ENV === 'production')
  redisClient.auth(rtgPassword, (err, reply) => console.log(err, reply));

module.exports = {
  eventUpdatesLimiter: new RateLimit({
    store: new RedisStore({
      client: redisClient,
      prefix: 'rl-update',
      expiry: 10,
    }),
    windowMs: 10000, // 10 seconds
    max: 1, // limit each IP to 1 request per windowMs
    delayMs: 0, // disable delaying - full speed until the max limit is reached
    message: { 'message': errorMessages.FORBIDDEN_EXCEED_LIMIT_EVENT_UPDATES },
  }),
  nightbotLimiter: new RateLimit({
    store: new RedisStore({
      client: redisClient,
      prefix: 'rl-nightbot',
      expiry: 5,
    }),
    windowMs: 5000, // 5 seconds
    max: 1, // limit each IP to 1 request per windowMs
    delayMs: 0, // disable delaying - full speed until the max limit is reached
  }),
  passwordResetLimiter: new RateLimit({
    store: new RedisStore({
      client: redisClient,
      prefix: 'rl-password-reset',
      expiry: 1 * 60 * 60,
    }),
    windowMs: 1000 * 60 * 60, // 1 hour
    max: 1, // limit each IP to 1 request per windowMs
    delayMs: 0, // disable delaying - full speed until the max limit is reached
    message: { 'message': errorMessages.FORBIDDEN_EXCEED_LIMIT_PASSWORD_RESET },
  }),
};
