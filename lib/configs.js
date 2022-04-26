module.exports = {
  WEB_SERVER: {
    PORT: process.env.PORT || 6060,
    ENV: process.env.NODE_ENV || 'development',
    ORIGIN:
      process.env.NODE_ENV === 'production'
        ? process.env.API_ORIGIN
        : 'http://localhost:6060',
  },
  OAUTH: {
    GOOGLE_CLIENT: process.env.GOOGLE_CLIENT,
    GOOGLE_SECRET: process.env.GOOGLE_SECRET,
    TWITCH_CLIENT: process.env.TWITCH_CLIENT,
    TWITCH_SECRET: process.env.TWITCH_SECRET,
  },
  CLIENT: {
    URL_ORIGIN:
      process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_DOMAIN
        : 'http://localhost:3000',
  },
  ADMIN: {
    URL_ORIGIN: process.env.ADMIN_DOMAIN,
  },
  META: {
    API_VERSION: process.env.API_VERSION,
    CONTACT_EMAIL: process.env.CONTACT_EMAIL,
    ACTIVATION_EMAIL: process.env.ACTIVATION_EMAIL,
  },
  SESSION: {
    STORE_URL: process.env.MONGO_URI,
    STORE_SECRET: process.env.SESSION_SECRET,
  },
  REDIS: {
    REDIS_URL:
      process.env.NODE_ENV === 'production'
        ? process.env.REDISTOGO_URL
        : '127.0.0.1',
    REDIS_PORT:
      process.env.NODE_ENV === 'production'
        ? process.env.REDISTOGO_PORT
        : '6379',
  },
  SHORTENER: {
    URL_ORIGIN: process.env.SHORTENER_DOMAIN,
  },
  S3: {
    ENDPOINT: process.env.S3_ENDPOINT,
    KEY: process.env.S3_KEY,
    SECRET: process.env.S3_SECRET,
  },
  SEND_GRID: {
    KEY: process.env.SENDGRID_KEY,
    TEMPLATES: {
      ACTIVATION: process.env.SENDGRID_ACTIVATION_TEMPLATE,
      PASSWORD_RESET: process.env.SENDGRID_PASSWORD_RESET_TEMPLATE,
    },
  },
  DATABASE: {
    SINGULARITY: process.env.MONGO_URI,
    SINGULARITY_ADMIN: process.env.ADMIN_MONGO_URI,
  },
};
