const { META } = require('./configs');

require('dotenv').config();

const WEBHOOKS = {
  PER_EVENT_LIMIT: 20,
  PER_ACCOUNT_LIMIT: 40,
};

const eventStatus = {
  ONGOING: 0,
  UPCOMING: 1,
  COMPLETED: 2,
};

const USER_ORGANIZATION_STATUS = {
  DEFAULT: -1,
  PENDING: 0,
  APPROVED: 1,
  REJECTED: 2,
};

const EVENTS_SEARCH_ACTIONS = {
  INITIAL: 'INITIAL',
  FILTERED: 'FILTERED',
  SEARCH: 'SEARCH',
  TERM: 'TERM',
  DATETIME: 'DATETIME',
  STATUS: 'STATUS',
  ALL: 'ALL',
};
const TEMPLATES_SEARCH_ACTIONS = {
  INITIAL: 'INITIAL',
  SEARCH: 'SEARCH',
};

const orgApplicationStatus = {
  DEFAULT: -1,
  PENDING: 0,
  APPROVED: 1,
  REJECTED: 2,
};

const eventTypes = {
  PRIVATE: 'private',
  PUBLIC: 'public',
};

const DATABASE_SEARCH_INDEXES = {
  TEMPLATES: 'template_name',
  EVENTS: 'event_name',
};

const errorTypes = {
  ValidationError: 422,
  VALIDATE_DISPLAYNAME: 422,
  PASSPORT_AUTH_FAILURE: 400,
  UniqueViolationError: 409,
  INTERNAL: 500,
  UNAUTHORIZED: 401,
  INVALID_SIGNIN: 401,
  ALREADY_AUTHED: 203,
  USER_ALREADY_EXIST: 409,
  ALREADY_EXIST: 409,
  WEBHOOK_URL_INVALID: 400,
  MISSING_BODY: 400,
  MALFORMED_INFO: 400,
  NOT_FOUND: 404,
  FORBIDDEN_EXCEED_LIMIT_EVENT_UPDATES: 403,
  FORBIDDEN_EXCEED_LIMIT_WEBHOOKS: 403,
  FORBIDDEN_EXCEED_LIMIT_PINGS: 403,
  FORBIDDEN_EXCEED_LIMIT_WEBHOOKS: 403,
  FORBIDDEN_EVENT_ONGOING: 403,
  FORBIDDEN_EVENT_COMPLETED: 403,
};

const errorMessages = {
  ValidationError: `Validating the request info has failed. Please check your request and try again - or contact us.`,
  PASSPORT_AUTH_TWITCH_FAILURE: `Apologies, authentication has failed. The email was used through another provider(Google or Twitch). Please check your request OR head to Twitch and make sure you are on the right account. and try again - or contact us.`,
  PASSPORT_AUTH_FAILURE: `Apologies, authentication has failed. The email was used through another provider(Google or Twitch). Please check your request and try again - or contact us.`,
  UniqueViolationError: `Apologies, resource already exists. Please check your request and try again - or contact us.`,
  INTERNAL: `Apologies, an internal error occurred, Please try again later or contact us.`,
  ALREADY_AUTHED: 'Already authorized.',
  USER_ALREADY_EXIST: `Apologies, signing up has failed. The provided email is already in use. Please check your request and try again - or contact us.`,
  EMAIL_AND_USERNAME_IN_USE: `Apologies, signing up has failed. The provided email and username is already in use. Please choose a different values and try again - or contact us.`,
  USERNAME_IN_USE: `Apologies, signing up has failed. The provided username is already in use. Please choose a different username and try again - or contact us.`,
  EMAIL_IN_USE: `Apologies, signing up has failed. The provided email is already in use. Please choose a different email and try again - or contact us.`,
  ALREADY_EXIST: `Apologies, resource already exists. Please check your request and try again - or contact us.`,
  MISSING_BODY: `Apologies, cannot process your request. The provided info is either partially missing or malformed. Please check your request and try again - or contact us.`,
  MALFORMED_INFO: `Apologies, cannot process your request. The provided info is either partially missing or malformed. Please check your request and try again - or contact us.`,
  UNAUTHORIZED: `Apologies, cannot process your request. Unauthorized. Please check your request and try again - or contact us.`,
  INVALID_SIGNIN: `Apologies, The provided email or password are incorrect. Please check your request and try again - or contact us.`,
  UNAUTHORIZED_CHANGE_PASSWORD: `Apologies, The provided current password is incorrect. Please check your request and try again - or contact us.`,
  NEEDS_ACTIVATION: `Apologies, Email verification is not complete, please verify your email to activate your account.  - or contact us.`,
  EXPIRED_ACTIVATION: `Apologies, Email verification is not complete & The current verification has expired. we have sent a new activation email. please verify your email to activate your account.  - or contact us.`,
  NOT_FOUND: `Apologies, the resource was not found. Please check your request and try again - or contact us.`,
  EMAIL_NOT_FOUND: `Apologies, The provided Email is not associated with any account. Please check your request and try again - or contact us.`,
  WEBHOOK_URL_INVALID:
    'Apologies, channel cannot be pinged due to an error with the provided Webhook URL. please check the channel data and try again.',
  FORBIDDEN_EXCEED_LIMIT_EVENT_UPDATES: `Apologies, you can only update once per 10 seconds. Try again in a bit`,
  FORBIDDEN_EXCEED_LIMIT_EVENT_WEBHOOKS: `Apologies, channel cannot be hooked, you have reached the maximum channels per-event(${WEBHOOKS.PER_EVENT_LIMIT}).`,
  FORBIDDEN_EXCEED_LIMIT_WEBHOOKS: `Apologies, channel cannot be created, you have reached the maximum channel webhooks per-user(${WEBHOOKS.PER_ACCOUNT_LIMIT}). Please delete unused channels and try again.`,
  FORBIDDEN_EXCEED_LIMIT_PINGS: `Apologies, but you can only ping a channel once per day.`,
  FORBIDDEN_EXCEED_LIMIT_PASSWORD_RESET: `Apologies, You can only request a password change once per 1 hour. Try again later - or contact us.`,
  FORBIDDEN_EVENT_ONGOING:
    "Apologies. Event cannot be updated while it's currently live.",
  FORBIDDEN_EVENT_COMPLETED:
    'Apologies. Event cannot be updated when it has already ended.',
  VALIDATE_DISPLAYNAME: `Apologies, display name must match the username. Only Dashes, spaces or capitalizations is allowed. Please check your request and try again - or contact us.`,
};

module.exports = {
  errorMessages,
  errorTypes,
  eventStatus,
  eventTypes,
  WEBHOOKS,
  orgApplicationStatus,
  USER_ORGANIZATION_STATUS,
  EVENTS_SEARCH_ACTIONS,
  TEMPLATES_SEARCH_ACTIONS,
  DATABASE_SEARCH_INDEXES,
};
