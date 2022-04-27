const axios = require("axios").default;
const {
  errorMessages,
  eventTypes,
  eventStatus,
  USER_ORGANIZATION_STATUS,
  EVENTS_SEARCH_ACTIONS,
  DATABASE_SEARCH_INDEXES,
} = require("../../lib/constants");
const {
  startOfLocalToUtc,
  endOfLocalToUtc,
  getUtc,
  isPast,
  fromDate,
  addDaysFromNow,
  subtractDaysFromNow,
} = require("../../lib/dates");
const util = require("util");
const { ObjectId } = require("mongoose").Types;
const { createUniqueId } = require("../../lib/utils");
const { _isEmpty } = require("../../lib/validation");
const { multiNewTeams } = require("./../team/team.controller");
const { getDiscordWebhookById } = require("./../webhooks/webhook.controller");
const { incTemplateUsedById } = require("../template/template.controller");
const difference = require("lodash.difference");
const sortBy = require("lodash.sortby");
const defaults = require("lodash.defaults");
const { WEB_SERVER, META, SHORTENER, CLIENT } = require("../../lib/configs");

/**
 * @type {import('mongoose').Collection}
 */
const Event = require("./event.model");
/**
 * @type {import('mongoose').Collection}
 */
const User = require("../user/user.model");
/**
 * @type {import('mongoose').Collection}
 */
const Organization = require("../organization/organization.model");
/**
 * @type {import('mongoose').Collection}
 */
const Webhook = require("../webhooks/webhook.model");

// Creat
function newEvent(event, userid) {
  // TODO: Validate event object
  // prettier-ignore

  return new Promise(async (resolve, reject) => {
    try {
      //
      const { templateId } = event;
      

      if (templateId) await incTemplateUsed(userid, templateId);

      // Check if teams need to be created
      // deep clone teams object prettier-ignore
      const clonedTeams = [...event.teams].map(t => { return { ...t }});
      event.teams = await stampTeamsWithUniqueid(clonedTeams);
        
      // Generate a uniqueid
      const uniqueid = await createUniqueId(); 
      
      // Generate a nightbot shortened url
      const nightbotShortenedUrl = await requestNightbotShortenedUrl(uniqueid);
      // Generate a event shortened url
      const eventShortenedUrl = await requestEventShortenedUrl(uniqueid)
      
      const initializedEvent = {
        uniqueid: uniqueid,
        teams: event.teams,
        datetime: getUtc(event.datetime),
        standingsTable: generateStandings(event.teams),
        nightbotUrl: nightbotShortenedUrl,
        eventUrl: eventShortenedUrl,
        owner: ObjectId(userid),
        ...event,
      };
      
      const createdNewEvent = await new Event(initializedEvent).save();

      return resolve(createdNewEvent);
    } catch (error) {
      console.log(error.message);
      return reject(new Error(errorMessages.INTERNAL));
    }
  });
}

// Delete
function deleteEvent(uniqueid, userid) {
  return new Promise(async (resolve, reject) => {
    try {
      //
      const event = await Event.updateOne(
        {
          uniqueid: uniqueid,
          owner: ObjectId(userid),
        },
        {
          isDeleted: true,
        }
      );

      console.log(event);

      return resolve();
    } catch (error) {
      console.log(error);
      return reject(new Error(errorMessages.INTERNAL));
    }
  });
}

// Update
function updateEventStatus(uniqueid, status, userid) {
  return new Promise(async (resolve, reject) => {
    try {
      //
      const event = await Event.findOne({ uniqueid: uniqueid });

      // does event exist
      if (!event) return reject(new Error(errorMessages.NOT_FOUND));

      // Is authorized
      if (event.owner._id.toString() !== userid.toString())
        return next(new Error(errorMessages.UNAUTHORIZED));

      // if ending/stopping the event
      if (status === eventStatus.COMPLETED)
        await Event.updateOne(
          {
            uniqueid: uniqueid,
          },
          {
            // set to 2(completed) only if event has progressed
            status:
              event.toObject().currentRound > 0 ? status : eventStatus.UPCOMING,
            roundsTables:
              event.toObject().currentRound > 0
                ? event.toObject().roundsTables
                : [],
          }
        );

      // if starting the event
      if (status === eventStatus.ONGOING)
        await Event.updateOne(
          {
            uniqueid: uniqueid,
          },
          {
            status: status,
            roundsTables: generateRoundTables(
              event.toObject().teams,
              event.rounds
            ),
          }
        );

      return resolve();
    } catch (error) {
      console.log(error);
      return reject(new Error(errorMessages.INTERNAL));
    }
  });
}

function updateEventBasicInfo(uniqueid, data) {
  return new Promise(async (resolve, reject) => {
    try {
      //
      const { name, datetime, rounds, isPublic, description } = data;

      await Event.updateOne(
        {
          uniqueid: uniqueid,
        },
        {
          name: name,
          description: description,
          datetime: datetime,
          rounds: rounds,
          isPublic: isPublic,
        }
      );
      return resolve();
    } catch (error) {
      console.log(error.message);
      return reject(new Error(errorMessages.INTERNAL));
    }
  });
}

function updateEventTeams(uniqueid, data, userid) {
  return new Promise(async (resolve, reject) => {
    try {
      //
      let { teams, shouldCreateTeams } = data;

      // Check if teams need to be created

      teams = await stampTeamsWithUniqueid(teams);

      await Event.updateOne(
        {
          uniqueid: uniqueid,
        },
        {
          teams: teams,
          standingsTable: generateStandings(teams),
          shouldCreateTeams: shouldCreateTeams,
        }
      );
      return resolve();
    } catch (error) {
      console.log(error.message);
      return reject(new Error(errorMessages.INTERNAL));
    }
  });
}

function updateEventPrize(uniqueid, data) {
  return new Promise(async (resolve, reject) => {
    try {
      //
      const {
        prizepool,
        prizepoolDistribution,
        prizepoolCurrency,
        remainingPrizepool,
        hasPrizepool,
      } = data;

      await Event.updateOne(
        {
          uniqueid: uniqueid,
        },
        {
          prizepool: prizepool,
          prizepoolDistribution: prizepoolDistribution,
          prizepoolCurrency: prizepoolCurrency,
          remainingPrizepool: remainingPrizepool,
          hasPrizepool: hasPrizepool,
        }
      );

      return resolve();
    } catch (error) {
      console.log(error.message);
      return reject(new Error(errorMessages.INTERNAL));
    }
  });
}

function updateEventPoints(uniqueid, data) {
  return new Promise(async (resolve, reject) => {
    try {
      //
      const { pointPerKill, pointsDistribution } = data;

      await Event.updateOne(
        {
          uniqueid: uniqueid,
        },
        {
          pointPerKill: pointPerKill,
          pointsDistribution: pointsDistribution,
        }
      );

      return resolve();
    } catch (error) {
      console.log(error.message);
      return reject(new Error(errorMessages.INTERNAL));
    }
  });
}

function updateEventDiscordWebhooks(uniqueid, data) {
  return new Promise(async (resolve, reject) => {
    try {
      // TODO: FIGURE OUT A MORE RELIABLE WAY TO UPDATE WEBHOOKS HINT: MONGODB HAS $addToSet for adding unique values

      const {
        action,
        data: { webhooks },
      } = data;

      console.log(action);
      console.log(webhooks);

      // if new webhooks are greater/equal the limit
      if (webhooks.length >= 20)
        return reject(
          new Error(errorMessages.FORBIDDEN_EXCEED_LIMIT_EVENT_WEBHOOKS)
        );

      const event = await Event.findOne({ uniqueid: uniqueid });

      const { discord_webhooks: event_webhooks } = event.toObject();

      // if event's current webhooks are greater/equal the limit
      if (
        event_webhooks.length === 20 ||
        webhooks.length + event_webhooks.length > 20
      )
        return reject(
          new Error(errorMessages.FORBIDDEN_EXCEED_LIMIT_EVENT_WEBHOOKS)
        );

      switch (action) {
        case "add":
          await Event.updateOne(
            {
              uniqueid: uniqueid,
            },
            {
              $addToSet: { discord_webhooks: { $each: webhooks } },
            }
          );
          return resolve();
        case "remove":
          await Event.updateOne(
            {
              uniqueid: uniqueid,
            },
            {
              $pull: { discord_webhooks: { $in: webhooks } },
            }
          );
          return resolve();
        default:
          break;
      }

      return resolve();
    } catch (error) {
      console.log(error);
      return reject(new Error(errorMessages.INTERNAL));
    }
  });
}

function updateEventLobbyCode(uniqueid, data) {
  return new Promise(async (resolve, reject) => {
    try {
      //
      await Event.updateOne(
        {
          uniqueid: uniqueid,
        },
        { lobbyCode: data.lobbyCode }
      );
      return resolve();
    } catch (error) {
      console.log(error.message);
      return reject(new Error(errorMessages.INTERNAL));
    }
  });
}

function updateEventNotify(uniqueid, data) {
  return new Promise(async (resolve, reject) => {
    try {
      //
      await Event.updateOne(
        {
          uniqueid: uniqueid,
        },
        { notify: data.notify }
      );
      return resolve();
    } catch (error) {
      console.log(error.message);
      return reject(new Error(errorMessages.INTERNAL));
    }
  });
}

function updateEventRoundsTables(uniqueid, { data }, round, req) {
  return new Promise(async (resolve, reject) => {
    try {
      // TODO: Validate that incoming roundsTable has exactly same uniqueids in standingsTable/event teams

      const event = await Event.findOne({
        uniqueid: uniqueid,
      });

      // check if exists
      if (!event) return reject(new Error(errorMessages.NOT_FOUND));
      // check if owner
      if (event.toObject().owner._id.toString() !== req.user._id.toString())
        return next(new Error(errorMessages.UNAUTHORIZED));

      const teamsChecksum = event.toObject().teams.map((t) => t.uniqueid);
      const roundTeams = data.table.map((d) => d.uniqueid);

      // Make sure original teams uniqueids is equal to the supplied-by-user teams in round table
      if (difference(teamsChecksum, roundTeams).length)
        return reject(Error(errorMessages.MALFORMED_INFO));

      const newEventsRoundTables = event.roundsTables.map((r) => {
        if (r.round === data.round)
          return { round: r.round, table: data.table };
        return r;
      });

      const ks = await Event.updateOne(
        { uniqueid: uniqueid },
        {
          roundsTables: newEventsRoundTables,
        }
      );

      return resolve();
    } catch (error) {
      console.log(error);
      return reject(new Error(errorMessages.INTERNAL));
    }
  });
}

function updateEventEndRound(uniqueid, { data }, round, req) {
  return new Promise(async (resolve, reject) => {
    try {
      // this will check if event is found and also is owner or not
      // WTF IS THIS SHIT!!
      // await updateEventRoundsTables(uniqueid, { data }, round, req);

      const event = await Event.findOne({ uniqueid: uniqueid });

      if (parseInt(round) !== event.toObject().currentRound) {
        console.log("parseInt");
        return reject(new Error(errorMessages.MALFORMED_INFO));
      }

      // Constants:
      const eventStandings = event.toObject().standingsTable;
      const pointPerKill = event.toObject().pointPerKill;
      const pointsDistribution = event.toObject().pointsDistribution;

      // Calculate scores for round X
      const roundStandings = event
        .toObject()
        .roundsTables[round].table.map((team) => {
          // calculate kills
          const kills = team.kills * pointPerKill;
          // set points for placement based on set distribution
          const placement =
            pointsDistribution[team.placement < 1 ? 19 : team.placement - 1];
          // Set total points
          const points = kills + placement;
          return { name: team.name, uniqueid: team.uniqueid, points: points };
        });

      const newStandings = roundStandings.map((standing) => {
        team = eventStandings.find(
          (eventStanding) => standing.uniqueid === eventStanding.uniqueid
        );
        team.points = team.points + standing.points;

        return team;
      });

      await Event.updateOne(
        {
          uniqueid: uniqueid,
        },
        { standingsTable: newStandings, currentRound: event.currentRound + 1 }
      );

      return resolve();
    } catch (error) {
      console.log(error);
      return reject(new Error(errorMessages.INTERNAL));
    }
  });
}

// Read
function autoStartEvents() {
  return new Promise(async (resolve, reject) => {
    try {
      //

      console.log(new Date());
      const result = await Event.updateMany(
        {
          isDeleted: false,
          status: eventStatus.UPCOMING,
          datetime: { $lte: new Date() },
        },
        { status: eventStatus.ONGOING }
      );

      console.log(result);
      return resolve();
    } catch (error) {
      console.log(error);
      return reject(new Error(errorMessages.INTERNAL));
    }
  });
}

function autoEndEvents() {
  return new Promise(async (resolve, reject) => {
    try {
      //

      console.log(subtractDaysFromNow(2));
      const result = await Event.updateMany(
        {
          isDeleted: false,
          status: eventStatus.ONGOING,
          datetime: { $lt: subtractDaysFromNow(2) },
        },
        { status: eventStatus.COMPLETED }
      );

      console.log(result);
      return resolve();
    } catch (error) {
      console.log(error);
      return reject(new Error(errorMessages.INTERNAL));
    }
  });
}

function getExploreEvents(skip, sort, limit, meta) {
  // Skip validation
  skip = Number(skip) ? Number(skip) : 0;
  skip = skip < 0 ? 0 : skip;
  // Limit validation
  limit = Number(limit) ? Number(limit) : 8;
  limit = limit < 0 ? 8 : limit;
  // Sort validation
  sort = sort !== "asc" && sort !== "desc" ? "asc" : sort;

  return new Promise(async (resolve, reject) => {
    try {
      //

      const { type, filters } = meta;
      let results, events, total;
      console.log("skip: ", skip);
      console.log("limit: ", limit);

      switch (type) {
        // Initial load from client
        case EVENTS_SEARCH_ACTIONS.INITIAL:
          console.log("=== Type: Initial");
          [results] = await Event.aggregate([
            {
              $facet: {
                events: [
                  {
                    $match: { isPublic: true, isDeleted: false },
                  },
                  {
                    $sort: {
                      status: 1,
                      datetime: sort === "asc" ? 1 : -1,
                    },
                  },
                  { $skip: skip },
                  { $limit: limit },
                  {
                    $lookup: {
                      from: "users",
                      let: { user_id: "$owner" },
                      pipeline: [
                        {
                          $match: {
                            $expr: { $eq: ["$_id", "$$user_id"] },
                          },
                        },
                        {
                          $project: {
                            username: 1,
                            organization_status: 1,
                            organization: 1,
                            _id: 1,
                          },
                        },
                        {
                          $lookup: {
                            from: "organizations",
                            let: { organization_id: "$organization" },
                            pipeline: [
                              {
                                $match: {
                                  $expr: {
                                    $eq: ["$_id", "$$organization_id"],
                                  },
                                },
                              },
                              {
                                $project: {
                                  name: 1,
                                  uniqueid: 1,
                                  _id: 1,
                                },
                              },
                            ],
                            as: "organization",
                          },
                        },
                        {
                          $unwind: {
                            path: "$organization",
                            preserveNullAndEmptyArrays: true,
                          },
                        },
                      ],
                      as: "owner",
                    },
                  },
                  {
                    $unwind: "$owner",
                  },
                  // Root level projection
                  {
                    $project: {
                      owner: 1,
                      name: 1,
                      uniqueid: 1,
                      datetime: 1,
                      rounds: 1,
                      currentRound: 1,
                      status: 1,
                      hasPrizepool: 1,
                      prizepool: 1,
                      prizepoolCurrency: 1,
                      isPublic: 1,
                    },
                  },
                ],
                total: [
                  {
                    $match: {
                      isDeleted: false,
                      isPublic: true,
                    },
                  },
                  {
                    $count: "total",
                  },
                ],
              },
            },
            {
              $unwind: "$total",
            },
          ]);
          // if not results found, resolve with empty pagination and empty events rather than 404 ERROR
          if (!results?.events)
            return resolve({
              pagination: {
                total: 0,
                remaining: 0,
                hasMore: false,
                resultCount: 0,
              },
              events: [],
            });
          events = results.events;
          total = results.total.total;
          break;

        // Search load from client
        case EVENTS_SEARCH_ACTIONS.SEARCH:
          console.log("=== Type: Search");
          [results] = await Event.aggregate([
            {
              $search: {
                index: DATABASE_SEARCH_INDEXES.EVENTS,
                text: {
                  query: filters.term,
                  path: {
                    wildcard: "*",
                  },
                },
              },
            },
            {
              $match: { isPublic: true, isDeleted: false },
            },
            {
              $facet: {
                events: [
                  {
                    $sort: {
                      status: 1,
                      datetime: sort === "asc" ? 1 : -1,
                    },
                  },
                  { $skip: skip },
                  { $limit: limit },
                  {
                    $lookup: {
                      from: "users",
                      let: { user_id: "$owner" },
                      pipeline: [
                        {
                          $match: {
                            $expr: { $eq: ["$_id", "$$user_id"] },
                          },
                        },
                        {
                          $project: {
                            username: 1,
                            organization_status: 1,
                            organization: 1,
                            _id: 1,
                          },
                        },
                        {
                          $lookup: {
                            from: "organizations",
                            let: { organization_id: "$organization" },
                            pipeline: [
                              {
                                $match: {
                                  $expr: {
                                    $eq: ["$_id", "$$organization_id"],
                                  },
                                },
                              },
                              {
                                $project: {
                                  name: 1,
                                  uniqueid: 1,
                                  _id: 1,
                                },
                              },
                            ],
                            as: "organization",
                          },
                        },
                        {
                          $unwind: {
                            path: "$organization",
                            preserveNullAndEmptyArrays: true,
                          },
                        },
                      ],
                      as: "owner",
                    },
                  },
                  {
                    $unwind: "$owner",
                  },
                  // Root level projection
                  {
                    $project: {
                      owner: 1,
                      name: 1,
                      uniqueid: 1,
                      datetime: 1,
                      rounds: 1,
                      currentRound: 1,
                      status: 1,
                      hasPrizepool: 1,
                      prizepool: 1,
                      prizepoolCurrency: 1,
                      isPublic: 1,
                    },
                  },
                ],
                total: [
                  {
                    $match: {
                      isDeleted: false,
                      isPublic: true,
                    },
                  },
                  {
                    $count: "total",
                  },
                ],
              },
            },
            {
              $unwind: "$total",
            },
          ]);
          // if not results found, resolve with empty pagination and empty events rather than 404 ERROR
          if (!results?.events)
            return resolve({
              pagination: {
                total: 0,
                remaining: 0,
                hasMore: false,
                resultCount: 0,
              },
              events: [],
            });
          events = results.events;
          total = results.total.total;
          break;

        // Any filtered load from client
        case EVENTS_SEARCH_ACTIONS.FILTERED:
          console.log("=== Type: Filtered");
          // Determine the aggregation pipeline stages
          const stagesBasedOnFilters = () => {
            // Search, Datetime & Status
            if (
              filters?.gte &&
              filters?.lte &&
              filters?.status?.length &&
              filters?.term
            ) {
              console.log("=== Search, Datetime & Status");
              return {
                $search: {
                  index: DATABASE_SEARCH_INDEXES.EVENTS,
                  text: {
                    query: filters.term,
                    path: "name",
                    fuzzy: {},
                  },
                },
                $match: {
                  isPublic: true,
                  isDeleted: false,
                  datetime: {
                    $gte: new Date(startOfLocalToUtc(filters.gte, "day")),
                    $lte: new Date(endOfLocalToUtc(filters.lte, "day")),
                  },
                  status: {
                    $in: [...filters.status],
                  },
                },
              };
            }

            // Search & Datetime
            if (filters?.gte && filters?.lte && filters?.term) {
              console.log("=== Search & Datetime");
              return {
                $search: {
                  index: DATABASE_SEARCH_INDEXES.EVENTS,
                  text: {
                    query: filters.term,
                    path: "name",
                    fuzzy: {},
                  },
                },
                $match: {
                  isPublic: true,
                  isDeleted: false,
                  datetime: {
                    $gte: new Date(startOfLocalToUtc(filters.gte, "day")),
                    $lte: new Date(endOfLocalToUtc(filters.lte, "day")),
                  },
                },
              };
            }

            // Search & Status
            if (filters?.status?.length && filters?.term) {
              console.log("=== Search & Status");
              return {
                $search: {
                  index: DATABASE_SEARCH_INDEXES.EVENTS,
                  text: {
                    query: filters.term,
                    path: "name",
                    fuzzy: {},
                  },
                },
                $match: {
                  isPublic: true,
                  isDeleted: false,
                  status: {
                    $in: [...filters.status],
                  },
                },
              };
            }

            // Datetime & Status
            if (filters?.gte && filters?.lte && filters?.status?.length) {
              console.log("=== Datetime & Status");
              return {
                $match: {
                  isPublic: true,
                  isDeleted: false,
                  datetime: {
                    $gte: new Date(startOfLocalToUtc(filters.gte, "day")),
                    $lte: new Date(endOfLocalToUtc(filters.lte, "day")),
                  },
                  status: {
                    $in: [...filters.status],
                  },
                },
              };
            }

            // Search
            if (filters?.term) {
              console.log("=== Search");
              return {
                $search: {
                  index: DATABASE_SEARCH_INDEXES.EVENTS,
                  text: {
                    query: filters.term,
                    path: "name",
                    fuzzy: {},
                  },
                },
                $match: {
                  isPublic: true,
                  isDeleted: false,
                },
              };
            }

            // Datetime
            if (filters?.gte && filters?.lte) {
              console.log("=== Datetime");
              return {
                $match: {
                  isPublic: true,
                  isDeleted: false,
                  datetime: {
                    $gte: new Date(startOfLocalToUtc(filters.gte, "day")),
                    $lte: new Date(endOfLocalToUtc(filters.lte, "day")),
                  },
                },
              };
            }

            // Status
            if (filters?.status?.length) {
              console.log("=== Status");
              return {
                $match: {
                  isPublic: true,
                  isDeleted: false,
                  status: {
                    $in: [...filters.status],
                  },
                },
              };
            }

            return reject(new Error(errorMessages.MALFORMED_INFO));
          };

          // Flatten stages to ...spread them inline-ly
          const stages = Object.entries(stagesBasedOnFilters()).map((s, i) => {
            const stage = { [s[0]]: s[1] };
            return stage;
          });

          [results] = await Event.aggregate([
            ...stages,
            {
              $facet: {
                events: [
                  {
                    $sort: {
                      status: 1,
                      datetime: sort === "asc" ? 1 : -1,
                    },
                  },
                  { $skip: skip },
                  { $limit: limit },
                  {
                    $lookup: {
                      from: "users",
                      let: { user_id: "$owner" },
                      pipeline: [
                        {
                          $match: {
                            $expr: { $eq: ["$_id", "$$user_id"] },
                          },
                        },
                        {
                          $project: {
                            username: 1,
                            organization_status: 1,
                            organization: 1,
                            _id: 1,
                          },
                        },
                        {
                          $lookup: {
                            from: "organizations",
                            let: { organization_id: "$organization" },
                            pipeline: [
                              {
                                $match: {
                                  $expr: {
                                    $eq: ["$_id", "$$organization_id"],
                                  },
                                },
                              },
                              {
                                $project: {
                                  name: 1,
                                  uniqueid: 1,
                                  _id: 1,
                                },
                              },
                            ],
                            as: "organization",
                          },
                        },
                        {
                          $unwind: {
                            path: "$organization",
                            preserveNullAndEmptyArrays: true,
                          },
                        },
                      ],
                      as: "owner",
                    },
                  },
                  {
                    $unwind: "$owner",
                  },
                  // Root level projection
                  {
                    $project: {
                      owner: 1,
                      name: 1,
                      uniqueid: 1,
                      datetime: 1,
                      rounds: 1,
                      currentRound: 1,
                      status: 1,
                      hasPrizepool: 1,
                      prizepool: 1,
                      prizepoolCurrency: 1,
                      isPublic: 1,
                    },
                  },
                ],
                total: [
                  {
                    $match: {
                      isDeleted: false,
                      isPublic: true,
                    },
                  },
                  {
                    $count: "total",
                  },
                ],
              },
            },
            {
              $unwind: "$total",
            },
          ]);

          // if not results found, resolve with empty pagination and empty events rather than 404 ERROR
          if (!results?.events)
            return resolve({
              pagination: {
                total: 0,
                remaining: 0,
                hasMore: false,
                resultCount: 0,
              },
              events: [],
            });
          events = results.events;
          total = results.total.total;
          break;

        // Not initial nor filtered
        default:
          return reject(new Error(errorMessages.MALFORMED_INFO));
      }

      // Results is not empty, therefore we do pagination logic
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

      return resolve(result);
    } catch (error) {
      console.log(error);
      return reject(new Error(errorMessages.INTERNAL));
    }
  });
}

function getMyEvents(skip, sort, limit, meta, userid) {
  // Skip validation
  skip = Number(skip) ? Number(skip) : 0;
  skip = skip < 0 ? 0 : skip;
  // Limit validation
  limit = Number(limit) ? Number(limit) : 8;
  limit = limit < 0 ? 8 : limit;
  // Sort validation
  sort = sort !== "asc" && sort !== "desc" ? "asc" : sort;

  return new Promise(async (resolve, reject) => {
    try {
      //

      const { type, filters } = meta;
      let results, events, total;

      switch (type) {
        // Initial load from client
        case EVENTS_SEARCH_ACTIONS.INITIAL:
          [results] = await Event.aggregate([
            {
              $facet: {
                events: [
                  {
                    $match: {
                      isDeleted: false,
                      owner: ObjectId(userid.toString()),
                    },
                  },
                  {
                    $sort: {
                      status: 1,
                      datetime: sort === "asc" ? 1 : -1,
                    },
                  },
                  { $skip: skip },
                  { $limit: limit },
                  // Root level projection
                  {
                    $project: {
                      owner: 1,
                      name: 1,
                      uniqueid: 1,
                      datetime: 1,
                      rounds: 1,
                      currentRound: 1,
                      status: 1,
                      hasPrizepool: 1,
                      prizepool: 1,
                      prizepoolCurrency: 1,
                      isPublic: 1,
                      nightbotUrl: 1,
                    },
                  },
                ],
                total: [
                  {
                    $match: {
                      isDeleted: false,
                      owner: ObjectId(userid.toString()),
                    },
                  },
                  {
                    $count: "total",
                  },
                ],
                ongoing: [
                  {
                    $match: {
                      isDeleted: false,
                      owner: ObjectId(userid.toString()),
                      status: eventStatus.ONGOING,
                    },
                  },
                  {
                    $count: "ongoing",
                  },
                ],
                upcoming: [
                  {
                    $match: {
                      isDeleted: false,
                      owner: ObjectId(userid.toString()),
                      status: eventStatus.UPCOMING,
                    },
                  },
                  {
                    $count: "upcoming",
                  },
                ],
                completed: [
                  {
                    $match: {
                      isDeleted: false,
                      owner: ObjectId(userid.toString()),
                      status: eventStatus.COMPLETED,
                    },
                  },
                  {
                    $count: "completed",
                  },
                ],
              },
            },
            {
              $unwind: {
                path: "$total",
              },
            },
            {
              $unwind: {
                path: "$ongoing",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $unwind: {
                path: "$upcoming",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $unwind: {
                path: "$completed",
                preserveNullAndEmptyArrays: true,
              },
            },
          ]);
          // if not results found, resolve with empty pagination and empty events rather than 404 ERROR
          if (!results?.events)
            return resolve({
              pagination: {
                total: 0,
                remaining: 0,
                hasMore: false,
                resultCount: 0,
              },
              events: [],
              stats: {
                total: 0,
                ongoing: 0,
                upcoming: 0,
                completed: 0,
              },
            });
          events = results.events;
          total = results.total.total;
          break;

        // Search load from client
        case EVENTS_SEARCH_ACTIONS.SEARCH:
          [results] = await Event.aggregate([
            {
              $search: {
                index: DATABASE_SEARCH_INDEXES.EVENTS,
                text: {
                  query: filters.term,
                  path: "name",
                  fuzzy: {},
                },
              },
            },
            {
              $match: {
                isDeleted: false,
                owner: ObjectId(userid.toString()),
              },
            },
            {
              $facet: {
                events: [
                  {
                    $sort: {
                      status: 1,
                      datetime: sort === "asc" ? 1 : -1,
                    },
                  },
                  { $skip: skip },
                  { $limit: limit },
                  // Root level projection
                  {
                    $project: {
                      owner: 1,
                      name: 1,
                      uniqueid: 1,
                      datetime: 1,
                      rounds: 1,
                      currentRound: 1,
                      status: 1,
                      hasPrizepool: 1,
                      prizepool: 1,
                      prizepoolCurrency: 1,
                      isPublic: 1,
                    },
                  },
                ],
                total: [
                  {
                    $match: {
                      isDeleted: false,
                      owner: ObjectId(userid.toString()),
                    },
                  },
                  {
                    $count: "total",
                  },
                ],
              },
            },
            {
              $unwind: "$total",
            },
          ]);

          // if not results found, resolve with empty pagination and empty events rather than 404 ERROR
          if (!results?.events)
            return resolve({
              pagination: {
                total: 0,
                remaining: 0,
                hasMore: false,
                resultCount: 0,
              },
              events: [],
              stats: {
                total: 0,
                ongoing: 0,
                upcoming: 0,
                completed: 0,
              },
            });
          events = results.events;
          total = results.total.total;
          break;

        // Any filtered load from client
        case EVENTS_SEARCH_ACTIONS.FILTERED:
          // Determine the aggregation pipeline stages
          const stagesBasedOnFilters = () => {
            // Search, Datetime & Status
            if (
              filters?.gte &&
              filters?.lte &&
              filters?.status?.length &&
              filters?.term
            ) {
              console.log("=== Search, Datetime & Status");
              return {
                $search: {
                  index: DATABASE_SEARCH_INDEXES.EVENTS,
                  text: {
                    query: filters.term,
                    path: "name",
                    fuzzy: {},
                  },
                },
                $match: {
                  owner: ObjectId(userid.toString()),
                  isDeleted: false,
                  datetime: {
                    $gte: new Date(startOfLocalToUtc(filters.gte, "day")),
                    $lte: new Date(endOfLocalToUtc(filters.lte, "day")),
                  },
                  status: {
                    $in: [...filters.status],
                  },
                },
              };
            }

            // Search & Datetime
            if (filters?.gte && filters?.lte && filters?.term) {
              console.log("=== Search & Datetime");
              return {
                $search: {
                  index: DATABASE_SEARCH_INDEXES.EVENTS,
                  text: {
                    query: filters.term,
                    path: "name",
                    fuzzy: {},
                  },
                },
                $match: {
                  owner: ObjectId(userid.toString()),
                  isDeleted: false,
                  datetime: {
                    $gte: new Date(startOfLocalToUtc(filters.gte, "day")),
                    $lte: new Date(endOfLocalToUtc(filters.lte, "day")),
                  },
                },
              };
            }

            // Search & Status
            if (filters?.status?.length && filters?.term) {
              console.log("=== Search & Status");
              return {
                $search: {
                  index: DATABASE_SEARCH_INDEXES.EVENTS,
                  text: {
                    query: filters.term,
                    path: "name",
                    fuzzy: {},
                  },
                },
                $match: {
                  owner: ObjectId(userid.toString()),
                  isDeleted: false,
                  status: {
                    $in: [...filters.status],
                  },
                },
              };
            }

            // Datetime & Status
            if (filters?.gte && filters?.lte && filters?.status?.length) {
              console.log("=== Datetime & Status");
              return {
                $match: {
                  owner: ObjectId(userid.toString()),
                  isDeleted: false,
                  datetime: {
                    $gte: new Date(startOfLocalToUtc(filters.gte, "day")),
                    $lte: new Date(endOfLocalToUtc(filters.lte, "day")),
                  },
                  status: {
                    $in: [...filters.status],
                  },
                },
              };
            }

            // Search
            if (filters?.term) {
              console.log("=== Search");
              return {
                $search: {
                  index: DATABASE_SEARCH_INDEXES.EVENTS,
                  text: {
                    query: filters.term,
                    path: "name",
                    fuzzy: {},
                  },
                },
                $match: {
                  owner: ObjectId(userid.toString()),
                  isDeleted: false,
                },
              };
            }

            // Datetime
            if (filters?.gte && filters?.lte) {
              console.log("=== Datetime");
              return {
                $match: {
                  owner: ObjectId(userid.toString()),
                  isDeleted: false,
                  datetime: {
                    $gte: new Date(startOfLocalToUtc(filters.gte, "day")),
                    $lte: new Date(endOfLocalToUtc(filters.lte, "day")),
                  },
                },
              };
            }

            // Status
            if (filters?.status?.length) {
              console.log("=== Status");
              return {
                $match: {
                  owner: ObjectId(userid.toString()),
                  isDeleted: false,
                  status: {
                    $in: [...filters.status],
                  },
                },
              };
            }

            return reject(new Error(errorMessages.MALFORMED_INFO));
          };

          // Flatten stages to ...spread them inline-ly
          const stages = Object.entries(stagesBasedOnFilters()).map((s, i) => {
            const stage = { [s[0]]: s[1] };
            return stage;
          });

          [results] = await Event.aggregate([
            ...stages,
            {
              $facet: {
                events: [
                  {
                    $sort: {
                      status: 1,
                      datetime: sort === "asc" ? 1 : -1,
                    },
                  },
                  { $skip: skip },
                  { $limit: limit },
                  // Root level projection
                  {
                    $project: {
                      owner: 1,
                      name: 1,
                      uniqueid: 1,
                      datetime: 1,
                      rounds: 1,
                      currentRound: 1,
                      status: 1,
                      hasPrizepool: 1,
                      prizepool: 1,
                      prizepoolCurrency: 1,
                      isPublic: 1,
                    },
                  },
                ],
                total: [{ $count: "total" }],
              },
            },
            {
              $unwind: "$total",
            },
          ]);

          // if not results found, resolve with empty pagination and empty events rather than 404 ERROR
          if (!results?.events)
            return resolve({
              pagination: {
                total: 0,
                remaining: 0,
                hasMore: false,
                resultCount: 0,
              },
              events: [],
              stats: {
                total: 0,
                ongoing: 0,
                upcoming: 0,
                completed: 0,
              },
            });
          events = results.events;
          total = results.total.total;
          break;

        // Not initial nor filtered
        default:
          return reject(new Error(errorMessages.MALFORMED_INFO));
      }

      // Results is not empty, therefore we do pagination logic
      const remaining = total - (skip + limit) < 0 ? 0 : total - (skip + limit);
      const result = {
        pagination: {
          total: total,
          remaining,
          hasMore: remaining !== 0,
          resultCount: events.length,
        },
        events,
        stats: {
          total: results?.total ? results?.total.total : 0,
          ongoing: results?.ongoing ? results?.ongoing.ongoing : 0,
          upcoming: results?.upcoming ? results?.upcoming.upcoming : 0,
          completed: results?.completed ? results?.completed.completed : 0,
        },
      };
      return resolve(result);
    } catch (error) {
      console.log(error);
      return reject(new Error(errorMessages.INTERNAL));
    }
  });
}

function getLiveEvents(skip, sort, limit, meta) {
  return new Promise(async (resolve, reject) => {
    try {
      //

      const events = await Event.find({
        isDeleted: false,
        status: eventStatus.ONGOING,
        type: eventTypes.PUBLIC,
      });

      return resolve(events);
    } catch (error) {
      console.log(error);
      return reject(new Error(errorMessages.INTERNAL));
    }
  });
}

function getAllEvents(skip, sort, limit) {
  return new Promise(async (resolve, reject) => {
    try {
      const filterQuery = {
        isPublic: true,
        isDeleted: false,
      };

      const total = await Event.countDocuments(filterQuery);
      const events = await Event.find(filterQuery, {
        _id: 0,
        name: 1,
        prizepool: 1,
        rounds: 1,
        hasPrizepool: 1,
        prizepoolCurrency: 1,
        currentStandings: 1,
        currentRound: 1,
        uniqueid: 1,
        userid: 1,
        datetime: 1,
        status: 1,
        owner: 1,
      })
        .populate({
          path: "owner",
          select: "_id displayName username organization_status organization",
        })
        .limit(limit)
        .skip(skip)
        .sort({ datetime: sort });

      return resolve({ events, total });
    } catch (error) {
      console.log(error);
      return reject(new Error(errorMessages.INTERNAL));
    }
  });
}

function getEventsCount() {
  return new Promise(async (resolve, reject) => {
    try {
      const total = await Event.countDocuments({});

      return resolve(total);
    } catch (error) {
      console.log(error);
      return reject(new Error(errorMessages.INTERNAL));
    }
  });
}

function getNightbotStandings(uniqueid) {
  return new Promise(async (resolve, reject) => {
    try {
      const event = await Event.findOne(
        { uniqueid, isDeleted: false },
        { __v: 0, isDeleted: 0, _id: 0 }
      );
      if (!event) return reject(new Error(errorMessages.NOT_FOUND));

      // Call and await url shortener
      const url = await requestEventShortenedUrl(event.toObject().uniqueid); // await axios.get('/shortener')
      return resolve(
        nightbotRenderStandings(
          event.name,
          event.currentRound + 1,
          event.rounds,
          event.standingsTable,
          event.status,
          event.datetime,
          event.eventUrl
        )
      );
    } catch (error) {
      console.log(error);
      return reject(new Error(errorMessages.INTERNAL));
    }
  });
}

function getEventsByStatus(skip, sort, limit, status) {
  return new Promise(async (resolve, reject) => {
    try {
      const filterQuery = {
        isDeleted: false,
        status,
        type: eventTypes.PUBLIC,
      };

      const total = await Event.countDocuments(filterQuery);
      const events = await Event.find(filterQuery, {
        _id: 0,
        name: 1,
        prizepool: 1,
        currentStandings: 1,
        currentRound: 1,
        uniqueid: 1,
        userid: 1,
        organizerName: 1,
        date: 1,
        status: 1,
      })
        .sort({ date: sort })
        .limit(limit)
        .skip(skip);

      return resolve({ events, total });
    } catch (error) {
      console.log(error);
      return reject(new Error(errorMessages.INTERNAL));
    }
  });
}

function getEventsBetween(dates) {
  return new Promise(async (resolve, reject) => {
    try {
      const { gte, lte } = dates;

      const events = await Event.find(
        {
          date: {
            $gte: new Date(startOfLocalToUtc(gte, "day")),
          },
        },
        { _id: 0, name: 1, date: 1 }
      ).sort({ date: "asc" });
      //2021-05-24T21:01:00.000Z
      return resolve(events);
    } catch (error) {
      console.log(error);
      return reject(new Error(errorMessages.INTERNAL));
    }
  });
}

function getEventByUniqueid(uniqueid, userid, code) {
  return new Promise(async (resolve, reject) => {
    try {
      //

      const [_event] = await Event.aggregate([
        {
          $match: { uniqueid: uniqueid, isDeleted: false },
        },
        {
          $lookup: {
            from: "users",
            let: { user_id: "$owner" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", "$$user_id"] },
                },
              },
              {
                $project: {
                  username: 1,
                  displayName: 1,
                  organization_status: 1,
                  organization: 1,
                  _id: 1,
                },
              },
              {
                $lookup: {
                  from: "organizations",
                  let: { organization_id: "$organization" },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $eq: ["$_id", "$$organization_id"],
                        },
                      },
                    },
                    {
                      $project: {
                        name: 1,
                        uniqueid: 1,
                        _id: 1,
                        avatar: 1,
                      },
                    },
                  ],
                  as: "organization",
                },
              },
              {
                $lookup: {
                  from: "webhooks",
                  let: { user_id: "$_id" },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $eq: ["$owner", "$$user_id"],
                        },
                        isDeleted: false,
                      },
                    },
                    {
                      $project: {
                        isDeleted: 0,
                        lastPinged: 0,
                        __v: 0,
                      },
                    },
                  ],
                  as: "owner_webhooks",
                },
              },
              {
                $unwind: {
                  path: "$organization",
                  preserveNullAndEmptyArrays: true,
                },
              },
            ],
            as: "owner",
          },
        },
        {
          $lookup: {
            from: "webhooks",
            let: { webhooks_arr: "$discord_webhooks" },
            pipeline: [
              {
                $match: {
                  $expr: { $in: ["$_id", "$$webhooks_arr"] },
                },
              },
              {
                $project: {
                  _id: 1,
                  server: 1,
                  channel: 1,
                  webhookUrl: 1,
                  owner: 1,
                  uniqueid: 1,
                },
              },
            ],
            as: "discord_webhooks",
          },
        },
        {
          $unwind: "$owner",
        },
        // Root level projection
        {
          $project: {
            __v: 0,
            isDeleted: 0,
            _id: 0,
          },
        },
      ]);

      if (!_event) return reject(new Error(errorMessages.NOT_FOUND));

      // Not owner + is not public
      // prettier-ignore
      if(_event.owner._id.toString() !== userid.toString() && !_event.isPublic) return reject(new Error(errorMessages.UNAUTHORIZED))

      // Not owner + is public
      if (_event.owner._id.toString() !== userid.toString())
        return resolve({
          ..._event,
          notify: null,
          remainingPrizepool: null,
          shouldCreateTeams: null,
          lobbyCode: _event.lobbyCode === code ? _event.lobbyCode : null,
          discordWebhooks: null,
          discord_webhooks: null,
          isPublic: null,
        });

      return resolve({ ..._event, isOwner: true });
    } catch (error) {
      console.log(error);
      return reject(new Error(errorMessages.INTERNAL));
    }
  });
}

function getEventLobbyCodeByUniqueid(uniqueid, userid) {
  return new Promise(async (resolve, reject) => {
    try {
      const event = await Event.findOne(
        { uniqueid, isDeleted: false },
        { __v: 0, isDeleted: 0, _id: 0 }
      );

      if (!event) return reject(new Error(errorMessages.NOT_FOUND));

      const { owner, lobbyCode } = event.toObject();

      console.log(owner);
      console.log(userid);

      if (owner.toString() !== userid.toString())
        return reject(new Error(errorMessages.UNAUTHORIZED));

      resolve({ lobby_code: lobbyCode });
    } catch (error) {
      console.log(error);
      return reject(new Error(errorMessages.INTERNAL));
    }
  });
}

function getPublicEventByUniqueid(uniqueid, code) {
  return new Promise(async (resolve, reject) => {
    try {
      const [event] = await Event.aggregate([
        { $match: { uniqueid: uniqueid, isDeleted: false } },
        {
          $lookup: {
            from: "users",
            let: { user_id: "$owner" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", "$$user_id"] },
                },
              },
              {
                $project: {
                  username: 1,
                  organization_status: 1,
                  organization: 1,
                  _id: 1,
                },
              },
              {
                $lookup: {
                  from: "organizations",
                  let: { organization_id: "$organization" },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $eq: ["$_id", "$$organization_id"],
                        },
                      },
                    },
                    {
                      $project: {
                        name: 1,
                        uniqueid: 1,
                        _id: 1,
                      },
                    },
                  ],
                  as: "organization",
                },
              },
              {
                $unwind: {
                  path: "$organization",
                  preserveNullAndEmptyArrays: true,
                },
              },
            ],
            as: "owner",
          },
        },
        {
          $project: {
            __v: 0,
            isDeleted: 0,
            _id: 0,
            notify: 0,
            remainingPrizepool: 0,
            shouldCreateTeams: 0,
            discordWebhooks: 0,
            discord_webhooks: 0,
            nightbotUrl: 0,
          },
        },
      ]);

      if (!event) return reject(new Error(errorMessages.NOT_FOUND));
      if (!event.isPublic) return reject(new Error(errorMessages.UNAUTHORIZED));

      return resolve({
        ...event,
        isPublic: null,
        lobbyCode: code === event.lobbyCode ? event.lobbyCode : null,
      });
    } catch (error) {
      console.log(error);
      return reject(new Error(errorMessages.INTERNAL));
    }
  });
}

function getEventAsPublicByUniqueid(uniqueid) {
  return new Promise(async (resolve, reject) => {
    try {
      const event = await Event.findOne(
        { uniqueid, isDeleted: false },
        { __v: 0, isDeleted: 0, _id: 0 }
      );

      if (!event) return reject(new Error(errorMessages.NOT_FOUND));

      return resolve(event.toObject());
    } catch (error) {
      console.log(error);
      return reject(new Error(errorMessages.INTERNAL));
    }
  });
}

function searchMyEvents(userid, skip, sort, limit, term) {
  return new Promise(async (resolve, reject) => {
    try {
      const results = await Event.aggregate([
        { $match: { $text: { $search: `${term}` } } },
        { $match: { owner: ObjectId(userid.toString()) } },
        {
          $project: { _id: 0, __v: 0 },
        },
        {
          $facet: {
            events: [
              { $skip: skip },
              { $limit: limit },
              { $sort: { datetime: sort === "asc" ? 1 : -1 } },
            ],
            total: [{ $count: "total" }],
          },
        },
      ]);

      // Not found
      if (!results[0].events.length)
        return resolve({
          events: [],
          total: 0,
        });

      resolve({
        events: { ...results[0] }.events,
        total: { ...results[0] }.total[0]?.total,
      });
    } catch (error) {
      console.log(error);
      return reject(new Error(errorMessages.INTERNAL));
    }
  });
}

function getMyRecentEvents(userid, sort, limit) {
  return new Promise(async (resolve, reject) => {
    try {
      const events = await Event.find(
        {
          owner: ObjectId(userid.toString()),
          status: {
            $in: [
              eventStatus.COMPLETED,
              eventStatus.UPCOMING,
              eventStatus.ONGOING,
            ],
          },
          isDeleted: false,
        },
        { _id: 0, __v: 0 }
      )
        .sort({ datetime: sort })
        .limit(limit);

      return resolve(events);
    } catch (error) {
      console.log(error);
      return reject(new Error(errorMessages.INTERNAL));
    }
  });
}

function getExploreEventsByOrganizer(userid, skip, sort, limit, meta) {
  // Skip validation
  skip = Number(skip) ? Number(skip) : 0;
  skip = skip < 0 ? 0 : skip;
  // Limit validation
  limit = Number(limit) ? Number(limit) : 8;
  limit = limit < 0 ? 8 : limit;
  // Sort validation
  sort = sort !== "asc" && sort !== "desc" ? "asc" : sort;

  return new Promise(async (resolve, reject) => {
    try {
      //

      const { type, filters } = meta;
      let results, events, total;

      console.log(filters);

      switch (type) {
        // Initial load from client
        case EVENTS_SEARCH_ACTIONS.INITIAL:
          console.log("=== By-owner -> Type: Initial");
          [results] = await Event.aggregate([
            {
              $facet: {
                events: [
                  {
                    $match: {
                      owner: ObjectId(userid.toString()),
                      isPublic: true,
                      isDeleted: false,
                    },
                  },
                  {
                    $sort: {
                      datetime: sort === "asc" ? 1 : -1,
                      name: 1,
                    },
                  },
                  { $skip: skip },
                  { $limit: limit },
                  {
                    $lookup: {
                      from: "users",
                      let: { user_id: "$owner" },
                      pipeline: [
                        {
                          $match: {
                            $expr: { $eq: ["$_id", "$$user_id"] },
                          },
                        },
                        {
                          $project: {
                            username: 1,
                            organization_status: 1,
                            organization: 1,
                            _id: 1,
                          },
                        },
                        {
                          $lookup: {
                            from: "organizations",
                            let: { organization_id: "$organization" },
                            pipeline: [
                              {
                                $match: {
                                  $expr: {
                                    $eq: ["$_id", "$$organization_id"],
                                  },
                                },
                              },
                              {
                                $project: {
                                  name: 1,
                                  uniqueid: 1,
                                  _id: 1,
                                },
                              },
                            ],
                            as: "organization",
                          },
                        },
                        {
                          $unwind: {
                            path: "$organization",
                            preserveNullAndEmptyArrays: true,
                          },
                        },
                      ],
                      as: "owner",
                    },
                  },
                  {
                    $unwind: "$owner",
                  },
                  // Root level projection
                  {
                    $project: {
                      owner: 1,
                      name: 1,
                      uniqueid: 1,
                      datetime: 1,
                      rounds: 1,
                      currentRound: 1,
                      status: 1,
                      hasPrizepool: 1,
                      prizepool: 1,
                      prizepoolCurrency: 1,
                      isPublic: 1,
                    },
                  },
                ],
                total: [
                  {
                    $match: {
                      isPublic: true,
                      isDeleted: false,
                      owner: ObjectId(userid.toString()),
                    },
                  },
                  {
                    $count: "total",
                  },
                ],
              },
            },
            {
              $unwind: "$total",
            },
          ]);
          // if not results found, resolve with empty pagination and empty events rather than 404 ERROR
          if (!results?.events)
            return resolve({
              pagination: {
                total: 0,
                remaining: 0,
                hasMore: false,
                resultCount: 0,
              },
              events: [],
            });
          events = results.events;
          total = results.total.total;
          break;

        // Not initial nor filtered
        default:
          return reject(new Error(errorMessages.MALFORMED_INFO));
      }

      // Results is not empty, therefore we do pagination logic
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

      return resolve(result);
    } catch (error) {
      console.log(error);
      return reject(new Error(errorMessages.INTERNAL));
    }
  });
}

// Other
function fireEventsNotifier({ events }) {
  return new Promise(async (resolve, reject) => {
    try {
      const nullableEvents = await Promise.all(
        events.map((event) => {
          return Event.findOne(
            { _id: event._id, notify: true },
            {
              _id: 1,
              name: 1,
              currentStandings: 1,
              organizerName: 1,
              rounds: 1,
              currentRound: 1,
            }
          );
        })
      );

      const eventsToNotify = nullableEvents.filter((event) => event != null);

      // prettier-ignore
      if (_isEmpty(eventsToNotify) || !eventsToNotify[0]) return resolve('no events to notify');

      const s = "dfd";

      await Promise.all(
        eventsToNotify.map((event) => {
          return axios.post(
            "https://discord.com/api/webhooks/860065488704372756/1mz2vCQb7ncbYJaLzdyJLTD-5bQ1VqahIcNejsW779L0IxDQcdyGhtVZvCmWq6ARid98?wait=true",
            {
              username: "singularity",
              avatar_url: "https://images2.imgbox.com/73/2f/J8wrIiAp_o.png",
              embeds: [
                {
                  title: "Events notifier 🏆🔔",
                  footer: {
                    text: "Made with love 💖 - @S3NSE1#1111",
                    icon_url: "https://images2.imgbox.com/73/2f/J8wrIiAp_o.png",
                  },
                  color: 13309254,
                  description: `\n **${event.name}** Has started!
                    - Total Rounds: **${event.rounds}**
                    - Event page: **[${event.name}](https://discord.com)**
                    - Organizer: **[${
                      event.organizerName
                    }](https://discord.com)**
                    \n
                    **📊 Standings:**
                    ${"```"}📍 - Current Round: ${event.currentRound}${"```"}
                    ${notifierRenderStandings(event.currentStandings)}
                  *visit [Event page](https://discord.com) for more*
                  \n
                  Check my [github page](https://github.com/Mesh-webDEV?tab=repositories)
                  Want to get in touch? email me at Sensei@singularity.events
                  \n
                    `,
                },
              ],
            }
          );
        })
      );

      resolve();
    } catch (error) {
      console.log(error);
      reject(error);
    }
  });
}

// Helper functions
function generateStandings(teams = []) {
  return teams.map((team) => {
    delete team.players;
    delete team._id;
    delete team.creatable;
    return { ...team, points: 0 };
  });
}

function generateRoundTables(teams = [], rounds) {
  return [...Array(rounds)].map((_, i) => {
    return { round: i, table: generateSingleRoundTable(teams) };
  });
}

function generateSingleRoundTable(teams = []) {
  return teams.map((team) => {
    return { ...team, kills: 0, placement: 0 };
  });
}

async function stampTeamsWithUniqueid(teams = []) {
  try {
    const stampedTeams = await Promise.all(
      teams.map(async (team) => {
        if (team.creatable)
          return { ...team, uniqueid: await createUniqueId(6) };
        return team;
      })
    );
    return stampedTeams;
  } catch (error) {
    console.log(error);
  }
}

function nightbotRenderStandings(
  eventName,
  currentRound,
  totalRounds,
  standings,
  status,
  datetime,
  url = "Singularity"
) {
  const sortedStandings = sortBy(standings, [(s) => s.points]).reverse();

  if (status === eventStatus.UPCOMING)
    return `✨ [${eventName.toUpperCase()}] | Upcoming.. Event starts ${fromDate(
      datetime
    )}. visit ${url ? url : "Singularity"} for more`;

  return `✨ [${eventName.toUpperCase()}] | ${sortedStandings.map(
    (s, i) => `#${i + 1} ${s.name}: ${s.points} -`
  )} (Round ${currentRound}/${totalRounds} in progress) visit ${
    url ? url : "Singularity"
  } for more`.replace(/,/g, " ");
}

function requestNightbotShortenedUrl(uniqueid) {
  return new Promise(async (resolve, reject) => {
    try {
      const { data } = await axios.post(`${SHORTENER.URL_ORIGIN}/links/new`, {
        url: `${WEB_SERVER.ORIGIN}/${META.API_VERSION}/events/${uniqueid}/nightbot-scores`,
      });
      return resolve(data.link.shortened);
    } catch (error) {
      resolve("");
    }
  });
}

function requestEventShortenedUrl(uniqueid) {
  return new Promise(async (resolve, reject) => {
    try {
      const { data } = await axios.post(`${SHORTENER.URL_ORIGIN}/links/new`, {
        url: `${CLIENT.URL_ORIGIN}/${uniqueid}`,
      });
      return resolve(data.link.shortened);
    } catch (error) {
      resolve("");
    }
  });
}

function incTemplateUsed(userid, templateId) {
  return new Promise(async (resolve, reject) => {
    try {
      await incTemplateUsedById(userid, templateId);
      resolve();
    } catch (error) {
      resolve("");
    }
  });
}

module.exports = {
  newEvent,
  deleteEvent,
  updateEventStatus,
  updateEventBasicInfo,
  updateEventTeams,
  updateEventPoints,
  updateEventPrize,
  updateEventDiscordWebhooks,
  updateEventLobbyCode,
  updateEventNotify,
  updateEventRoundsTables,
  updateEventEndRound,
  searchMyEvents,
  getExploreEvents,
  getLiveEvents,
  getAllEvents,
  getNightbotStandings,
  getEventsByStatus,
  getEventsCount,
  getMyRecentEvents,
  getMyEvents,
  getEventsBetween,
  getEventByUniqueid,
  getEventLobbyCodeByUniqueid,
  getPublicEventByUniqueid,
  getEventAsPublicByUniqueid,
  getExploreEventsByOrganizer,
  fireEventsNotifier,
  autoStartEvents,
  autoEndEvents,
};
