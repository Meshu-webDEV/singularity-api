// Controllers
const { findUser } = require("./api/user/user.controller");
const { getEventByUniqueid } = require("./api/event/event.controller");

// Utils
const { errorTypes, errorMessages, eventStatus } = require("./lib/constants");
const { getDiscordWebhookById } = require("./api/webhooks/webhook.controller");
const { getAdmin } = require("./api/admin/admin.controller");

function databaseStatus(req, res, next) {
  console.log("Database status: ", req.app.settings.database);
  if (typeof req.app.settings.database === "undefined")
    return next(new Error(errorMessages.INTERNAL));
  if (!req.app.settings.database)
    return next(new Error(errorMessages.INTERNAL));

  return next();
}

function notFound(req, res, next) {
  const error = new Error(`Not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
}

function errorHandler(error, req, res, next) {
  // console.log(error);
  let errorName = "";
  Object.entries(errorMessages).forEach((message) => {
    if (message[1] === error.message) errorName = message[0];
  });

  const errorCode = errorTypes[errorName] || 404;
  const statusCode = errorTypes[error.name] || errorCode;

  res.status(statusCode);
  res.json({
    status: statusCode,
    message: errorMessages[error.name] || error.message,
    stack: process.env.NODE_ENV === "production" ? "📚" : error.stack,
    errors: error.errors || undefined,
  });
}

// async function isAuth(req, res, next) {
//   // check token in the headers
//   try {
//     const authHeader = req.headers.authorization;
//     if (!authHeader) throw new Error(errorMessages.UNAUTHORIZED);

//     const token = authHeader.split(' ')[1];
//     await jwtVerify(token);

//     return next();
//   } catch (error) {
//     return next(new Error(errorMessages.UNAUTHORIZED));
//   }
// }

async function isAdminAuth(req, res, next) {
  // check token in the headers
  try {
    const KEY = req.headers["x-key"];
    const SECRET = req.headers["x-secret"];
    if (!KEY || !SECRET) return next(new Error(errorMessages.UNAUTHORIZED));

    // Check admin info
    await getAdmin(KEY, SECRET);

    return next();
  } catch (error) {
    return next(new Error(errorMessages.UNAUTHORIZED));
  }
}

async function isAuth(req, res, next) {
  // check token in the headers
  try {
    if (!req.user) return next(new Error(errorMessages.UNAUTHORIZED));
    return next();
  } catch (error) {
    return next(new Error(errorMessages.UNAUTHORIZED));
  }
}

async function userExist(req, res, next) {
  // check token in the headers
  try {
    await findUser(req.user._id);
    return next();
  } catch (error) {
    console.log("here");
    console.log(error);
    return next(new Error(errorMessages.UNAUTHORIZED));
  }
}

async function eventExist(req, res, next) {
  try {
    const { id } = req.params;
    // check if event is available and not isDeleted

    await getEventByUniqueid(id, req.user._id);

    return next();
  } catch (error) {
    return next(new Error(errorMessages.NOT_FOUND));
  }
}

async function isEventOwner(req, res, next) {
  try {
    const { uniqueid } = req.body;
    const { id } = req.params;

    // check if event is available and not isDeleted
    const event = await getEventByUniqueid(uniqueid || id, req.user._id);

    if (event.owner._id.toString() !== req.user._id.toString())
      return next(new Error(errorMessages.UNAUTHORIZED));

    return next();
  } catch (error) {
    return next(new Error(errorMessages.UNAUTHORIZED));
  }
}

async function isEventSettingsUpdatable(req, res, next) {
  try {
    const { uniqueid, criteria } = req.params;

    // check if event is available and not isDeleted
    const event = await getEventByUniqueid(
      req.body.uniqueid || uniqueid,
      req.user._id
    );

    if (event.owner._id.toString() !== req.user._id.toString())
      throw Error(errorMessages.UNAUTHORIZED);
    if (
      event.status === eventStatus.ONGOING &&
      criteria !== "rounds-tables" &&
      criteria !== "discord-webhooks" &&
      criteria !== "lobby-code"
    )
      throw Error(errorMessages.FORBIDDEN_EVENT_ONGOING);
    if (event.status === eventStatus.COMPLETED)
      throw Error(errorMessages.FORBIDDEN_EVENT_COMPLETED);

    return next();
  } catch (error) {
    console.log(error);

    return next(Error(error.message));
  }
}

async function validateEventUniqueidForm(req, res, next) {
  let { uniqueid } = req.params;

  if (!uniqueid || uniqueid.length < 21)
    return next(new Error(errorMessages.MALFORMED_INFO));

  return next();
}

async function validateOrganizationUniqueidForm(req, res, next) {
  let { uniqueid } = req.params;

  if (!uniqueid || uniqueid.length < 21)
    return next(new Error(errorMessages.MALFORMED_INFO));

  return next();
}

async function hookExist(req, res, next) {
  try {
    const { id } = req.params;

    console.log('middleware "hookExist"');

    await getDiscordWebhookById(req.user._id, id);

    return next();
  } catch (error) {
    return next(new Error(errorMessages.NOT_FOUND));
  }
}

module.exports = {
  databaseStatus,
  notFound,
  errorHandler,
  isAuth,
  isAdminAuth,
  isEventOwner,
  isEventSettingsUpdatable,
  validateEventUniqueidForm,
  validateOrganizationUniqueidForm,
  userExist,
  eventExist,
  hookExist,
};
