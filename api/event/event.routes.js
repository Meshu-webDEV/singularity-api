const { errorMessages, eventStatus } = require("../../lib/constants");
const {
  isAuth,
  userExist,
  eventExist,
  isEventOwner,
  isEventSettingsUpdatable,
  validateEventUniqueidForm,
} = require("../../middlewares");
const {
  newEvent,
  getAllEvents,
  getEventsByStatus,
  getEventsBetween,
  getMyEvents,
  getEventByUniqueid,
  fireEventsNotifier,
  getEventsByRange,
  updateEventBasicInfo,
  updateEventLobbyCode,
  updateEventNotify,
  updateEventTeams,
  updateEventPoints,
  updateEventPrize,
  updateEventStatus,
  updateEventRoundsTables,
  updateEventEndRound,
  updateEventDiscordWebhooks,
  getPublicEventByUniqueid,
  getNightbotStandings,
  getMyRecentEvents,
  searchMyEvents,
  getMyEventsTest,
  getEventLobbyCodeByUniqueid,
  getExploreEvents,
  getExploreEventsByOrganizer,
  deleteEvent,
  getLiveEvents,
  autoStartEvents,
  autoEndEvents,
} = require("./event.controller");

const { _isEmpty } = require("../../lib/validation");

const router = require("express").Router();

const {
  galacticoEventStart,
  galacticoEventProgress,
  galacticoEventEnded,
} = require("../../Galactico/notifier");
const { isPast } = require("../../lib/dates");

const {
  eventUpdatesLimiter,
  nightbotLimiter,
} = require("../../lib/ratelimiting");

// Query configs
const limit = 6;

// CREATE a new event: POST ../api/v1/events/new
router.post("/new", isAuth, userExist, async (req, res, next) => {
  if (_isEmpty(req.body)) return next(new Error(errorMessages.MISSING_BODY));

  try {
    const { uniqueid } = await newEvent(req.body, req.user._id);
    return res.json(uniqueid);
  } catch (error) {
    console.log(error);
    return next(error);
  }
});

// DELETE event: DELETE ../api/events/:id
router.delete(
  "/:uniqueid",
  isAuth,
  userExist,
  validateEventUniqueidForm,
  async (req, res, next) => {
    try {
      const { uniqueid } = req.params;
      await deleteEvent(uniqueid, req.user._id);
      return res.send();
    } catch (error) {
      return next(error);
    }
  }
);

// UPDATE event by uniqueid: GET ../api/v1/events/update/:uniqueid/:criteria
router.patch(
  "/update/:uniqueid/:criteria",
  eventUpdatesLimiter,
  isAuth,
  userExist,
  validateEventUniqueidForm,
  isEventSettingsUpdatable,
  async (req, res, next) => {
    try {
      const { uniqueid, criteria } = req.params;

      switch (criteria) {
        case "basic-info":
          await updateEventBasicInfo(uniqueid, req.body);
          return res.status(200).send();
        case "teams":
          await updateEventTeams(uniqueid, req.body, req.user._id);
          return res.status(200).send();
        case "points":
          await updateEventPoints(uniqueid, req.body);
          return res.status(200).send();
        case "prize":
          await updateEventPrize(uniqueid, req.body);
          return res.status(200).send();
        case "discord-notification":
          await updateEventNotify(uniqueid, req.body);
          return res.status(200).send();
        case "lobby-code":
          await updateEventLobbyCode(uniqueid, req.body);
          return res.status(200).send();
        case "discord-webhooks":
          await updateEventDiscordWebhooks(uniqueid, req.body);
          return res.status(200).send();
        default:
          return next(new Error(errorMessages.NOT_FOUND));
      }
    } catch (error) {
      return next(error);
    }
  }
);

// UPDATE start event by id: POST ../api/v1/events/start/:uniqueid
router.patch(
  "/start/:uniqueid",
  isAuth,
  userExist,
  validateEventUniqueidForm,
  isEventSettingsUpdatable,
  async (req, res, next) => {
    if (_isEmpty(req.params))
      return next(new Error(errorMessages.MISSING_BODY));

    try {
      const { uniqueid } = req.params;
      const { notify, webhookUrls } = req.query;
      await updateEventStatus(uniqueid, 0, req.user._id);

      // check notification stuff
      if (!notify) return res.send();
      if (!webhookUrls?.length) return res.send();

      const event = await getEventByUniqueid(uniqueid, req.user._id);
      // prettier-ignore
      const sanitizedWebhookUrls = typeof webhookUrls === 'string' ? [webhookUrls] : webhookUrls;
      let status = { started: true, notified: false };
      galacticoEventStart(sanitizedWebhookUrls, event)
        .then(() => {
          status.notified = true;
          console.log(status);
          return res.send(status);
        })
        .catch(() => {
          return res.json(status);
        });
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }
);

// UPDATE end event by id: POST ../api/v1/events/end/:uniqueid
router.patch(
  "/end/:uniqueid",
  isAuth,
  userExist,
  validateEventUniqueidForm,
  async (req, res, next) => {
    if (_isEmpty(req.params))
      return next(new Error(errorMessages.MISSING_BODY));

    try {
      const { uniqueid } = req.params;
      const { notify, webhookUrls } = req.query;

      await updateEventStatus(uniqueid, 2, req.user._id);

      // check notification stuff
      if (!notify) return res.send();
      if (!webhookUrls?.length) return res.send();

      console.log(req.user._id);
      const event = await getEventByUniqueid(uniqueid, req.user._id);

      console.log(!isPast(event.datetime) || !event.currentRound > 0);

      if (!isPast(event.datetime) || !event.currentRound > 0) return res.send();

      // prettier-ignore
      const sanitizedWebhookUrls = typeof webhookUrls === 'string' ? [webhookUrls] : webhookUrls;
      let status = { started: true, notified: false };
      galacticoEventEnded(sanitizedWebhookUrls, event)
        .then(() => {
          status.notified = true;
          console.log(status);
          return res.send(status);
        })
        .catch(() => {
          return res.json(status);
        });
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }
);

// UPDATE progress event update round by uniqueid: GET ../api/v1/events/progress/:uniqueid/:round/update
router.patch(
  "/progress/:uniqueid/:round/update",
  isAuth,
  userExist,
  validateEventUniqueidForm,
  eventUpdatesLimiter,
  async (req, res, next) => {
    try {
      const { uniqueid, round } = req.params;

      await updateEventRoundsTables(uniqueid, req.body, round, req);
      res.send();
    } catch (error) {
      return next(error);
    }
  }
);

// UPDATE progress event end round by uniqueid: GET ../api/v1/events/progress/:uniqueid/:round/end
router.patch(
  "/progress/:uniqueid/:round/end",
  isAuth,
  userExist,
  validateEventUniqueidForm,
  async (req, res, next) => {
    try {
      const { uniqueid, round } = req.params;
      const { notify, webhookUrls } = req.query;

      await updateEventRoundsTables(uniqueid, req.body, round, req);
      await updateEventEndRound(uniqueid, req.body, round, req);

      // check notification stuff
      if (!notify) return res.send();
      if (!webhookUrls?.length) return res.send();

      const event = await getEventByUniqueid(uniqueid, req.user._id);
      // prettier-ignore
      const sanitizedWebhookUrls = typeof webhookUrls === 'string' ? [webhookUrls] : webhookUrls;
      let status = { started: true, notified: false };
      galacticoEventProgress(sanitizedWebhookUrls, event)
        .then(() => {
          status.notified = true;
          console.log(status);
          return res.send(status);
        })
        .catch(() => {
          return res.json(status);
        });
    } catch (error) {
      return next(error);
    }
  }
);

// GET auto start events: GET ../api/v1/events/auto-start
router.get("/auto-update-status", async (req, res, next) => {
  //

  try {
    await autoStartEvents();
    await autoEndEvents();
    return res.send("ok!");
  } catch (error) {
    console.log(error);
    return next(error);
  }
});

// GET auto end events: GET ../api/v1/events/auto-start
router.get("/auto-end", async (req, res, next) => {
  //

  try {
    await autoEndEvents();
    return res.send("ok");
  } catch (error) {
    console.log(error);
    return next(error);
  }
});

// GET all events: GET ../api/v1/events/
router.get("/", async (req, res, next) => {
  let { skip = 0, sort = "asc" } = req.query;
  // Skip validation
  skip = Number(skip) ? Number(skip) : 0;
  skip = skip < 0 ? 0 : skip;
  // Sort validation
  sort = sort !== "asc" && sort !== "desc" ? "asc" : sort;

  try {
    const { events, total } = await getAllEvents(skip, sort, limit);
    const remaining = total - (skip + limit) < 0 ? 0 : total - (skip + limit);
    const result = {
      pagination: {
        total: total,
        remaining,
        hasMore: remaining !== 0,
        resultCount: events.length,
      },
      events,
    };

    return res.json(result);
  } catch (error) {
    console.log(error);
    return next(error);
  }
});

// GET explore events: GET ../api/v1/events/
router.post("/explore", async (req, res, next) => {
  //

  if (_isEmpty(req.body)) return next(new Error(errorMessages.MISSING_BODY));

  const meta = req.body;

  let { skip = 0, sort = "asc", limit = 8 } = req.query;

  try {
    const result = await getExploreEvents(skip, sort, limit, meta);
    return res.json(result);
  } catch (error) {
    console.log(error);
    return next(error);
  }
});

// GET live events: GET ../api/v1/events/
router.get("/live", async (req, res, next) => {
  //

  try {
    const result = await getLiveEvents();
    return res.json(result);
  } catch (error) {
    console.log(error);
    return next(error);
  }
});

// GET events by owner: GET ../api/v1/events/
router.post("/by-owner/:id", async (req, res, next) => {
  //
  if (_isEmpty(req.params))
    return next(new Error(errorMessages.MALFORMED_INFO));
  if (_isEmpty(req.body)) return next(new Error(errorMessages.MISSING_BODY));

  const { id } = req.params;
  const meta = req.body;

  let { skip = 0, sort = "asc", limit = 8 } = req.query;

  try {
    const result = await getExploreEventsByOrganizer(
      id,
      skip,
      sort,
      limit,
      meta
    );
    return res.json(result);
    // res.send();
  } catch (error) {
    console.log(error);
    return next(error);
  }
});

// GET my events: GET ../api/v1/events/my-events
router.post("/my-events", isAuth, userExist, async (req, res, next) => {
  console.log(req.body);

  if (_isEmpty(req.body)) return next(new Error(errorMessages.MISSING_BODY));

  const meta = req.body;

  let { skip = 0, sort = "asc", limit = 8 } = req.query;

  try {
    const result = await getMyEvents(skip, sort, limit, meta, req.user._id);
    return res.json(result);
  } catch (error) {
    console.log(error);
    return next(error);
  }
});

// GET Search my events: GET ../api/v1/events/my-events
router.get("/search-my-events", isAuth, userExist, async (req, res, next) => {
  let { skip = 0, sort = "asc", limit = 8, term = false } = req.query;
  // term validation
  if (!term) return next(new Error(errorMessages.MALFORMED_INFO));
  // Skip validation
  skip = Number(skip) ? Number(skip) : 0;
  skip = skip < 0 ? 0 : skip;
  // Limit validation
  limit = Number(limit) ? Number(limit) : 8;
  limit = limit < 0 ? 8 : limit;
  // Sort validation
  sort = sort !== "asc" && sort !== "desc" ? "asc" : sort;

  try {
    const { events, total } = await searchMyEvents(
      req.user._id,
      skip,
      sort,
      limit,
      term
    );
    const remaining = total - (skip + limit) < 0 ? 0 : total - (skip + limit);
    const result = {
      pagination: {
        total: total,
        remaining,
        hasMore: remaining !== 0,
        resultCount: events.length,
      },
      events,
    };
    res.json(result);
  } catch (error) {
    console.log(error);
    return next(error);
  }
});

// GET my recent events: GET ../api/v1/events/my-recent-events
router.get("/my-recent-events", isAuth, userExist, async (req, res, next) => {
  let { sort = "asc", limit = 8 } = req.query;

  // Limit validation
  limit = Number(limit) ? Number(limit) : 8;
  limit = limit < 0 ? 8 : limit;
  // Sort validation
  sort = sort !== "asc" && sort !== "desc" ? "asc" : sort;

  try {
    console.log(req.user);

    const events = await getMyRecentEvents(req.user._id, sort, limit);
    res.json(events);
  } catch (error) {
    console.log(error);
    return next(error);
  }
});

// GET event by uniqueid: GET ../api/v1/events/authorized/get-by-id/:uniqueid
router.get(
  "/authorized/by-id/:uniqueid",
  isAuth,
  validateEventUniqueidForm,
  userExist,
  async (req, res, next) => {
    try {
      const { uniqueid } = req.params;
      const { code = false } = req.query;

      const event = await getEventByUniqueid(
        uniqueid,
        req.user._id.toString(),
        code
      );
      return res.json(event);
    } catch (error) {
      return next(error);
    }
  }
);

// GET event by uniqueid: GET ../api/v1/events/viewer/get-by-id/:uniqueid
router.get(
  "/viewer/by-id/:uniqueid",
  validateEventUniqueidForm,
  async (req, res, next) => {
    try {
      const { uniqueid } = req.params;
      const { code = false } = req.query;
      const event = await getPublicEventByUniqueid(uniqueid, code);

      return res.json({ ...event, isOwner: false });
    } catch (error) {
      return next(error);
    }
  }
);

// GET lobby-code by uniqueid: GET ../api/v1/events/get-by-id/:uniqueid/lobby-code
router.get(
  "/by-id/:uniqueid/lobby-code",
  isAuth,
  userExist,
  validateEventUniqueidForm,
  async (req, res, next) => {
    // TODO: validate uniqueid

    try {
      let { uniqueid } = req.params;
      const lobbyCode = await getEventLobbyCodeByUniqueid(
        uniqueid,
        req.user._id
      );

      return res.json(lobbyCode);
    } catch (error) {
      return next(error);
    }
  }
);

// GET event between dates: POST ../api/v1/events/get-by-dates
router.post("/get-by-dates", async (req, res, next) => {
  if (_isEmpty(req.body)) return next(new Error(errorMessages.MISSING_BODY));

  try {
    const events = await getEventsBetween(req.body);
    return res.json({
      events,
    });
  } catch (error) {
    console.log(error);
    return next(error);
  }
});

// GET event nightbot scores by uniqueid: GET ../api/v1/events/:uniqueid/nightbot-scores/
router.get(
  "/:uniqueid/nightbot-scores",
  nightbotLimiter,
  validateEventUniqueidForm,
  async (req, res, next) => {
    // TODO: validate uniqueid
    let { uniqueid } = req.params;

    try {
      const standings = await getNightbotStandings(uniqueid);
      return res.send(standings);
    } catch (error) {
      return next(error);
    }
  }
);

// OTHER Notify subscribed webhooks when event starts: POST ../api/v1/events/notify
router.post("/notify/started", async (req, res, next) => {
  if (_isEmpty(req.body)) return next(new Error(errorMessages.MISSING_BODY));

  try {
    await fireEventsNotifier(req.body);

    return res.status(200).send("ok");
  } catch (error) {
    console.log(error);
    return next(error);
  }
});

module.exports = router;
