const { isEmpty } = require("lodash");
const {
  errorMessages,
  TEMPLATES_SEARCH_ACTIONS,
  DATABASE_SEARCH_INDEXES,
} = require("../../lib/constants");
const { createUniqueId } = require("../../lib/utils");
const { ObjectId } = require("mongoose").Types;
const util = require("util");

/**
 * @type {import('mongoose').Collection}
 */
const Template = require("./template.model");

async function newTemplate(userid, data) {
  return new Promise(async (resolve, reject) => {
    try {
      const uniqueid = await createUniqueId(8);
      // prettier-ignore
      const template = Object.fromEntries(Object.entries(data.template).filter(d => Boolean(d[1])));
      delete data.template;

      if (template.points) {
        template.pointsDistribution = template.points.pointsDistribution;
        template.pointPerKill = template.points.pointPerKill;
        delete template.points;
      }
      if (template.prizes) {
        template.hasPrizepool = true;
        template.prizepool = template.prizes.prizepool;
        template.prizepoolCurrency = template.prizes.prizepoolCurrency;
        template.prizepoolDistribution = template.prizes.prizepoolDistribution;
        template.remainingPrizepool = template.prizes.remainingPrizepool;
        delete template.prizes;
      }

      const createdTemplate = await new Template({
        template: template,
        ...data,
        owner: userid,
        uniqueid,
      }).save();

      console.log({ template: template, ...data, owner: userid, uniqueid });
      return resolve(createdTemplate.uniqueid);
    } catch (error) {
      console.log(error);
      reject(new Error(errorMessages.INTERNAL));
    }
  });
}

async function exploreTemplates(skip, limit, meta, userid) {
  // Skip validation
  skip = Number(skip) ? Number(skip) : 0;
  skip = skip < 0 ? 0 : skip;
  // Limit validation
  limit = Number(limit) ? Number(limit) : 8;
  limit = limit < 0 ? 8 : limit;

  return new Promise(async (resolve, reject) => {
    try {
      //

      const { type, filters } = meta;
      let results, templates, total;

      console.log(filters);
      console.log("Skip: ", skip);

      switch (type) {
        // Initial load from client
        case TEMPLATES_SEARCH_ACTIONS.INITIAL:
          console.log("=== Type: Initial");
          [results] = await Template.aggregate([
            {
              $facet: {
                templates: [
                  {
                    $match: {
                      isDeleted: false,
                      visible: true,
                    },
                  },
                  { $sort: { used: -1, name: 1 } },
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
                                  avatar: 1,
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
                      isDeleted: 0,
                      __v: 0,
                    },
                  },
                ],
                total: [
                  {
                    $match: {
                      isDeleted: false,
                      visible: true,
                    },
                  },
                  {
                    $count: "total",
                  },
                ],
              },
            },
            {
              $unwind: {
                path: "$total",
              },
            },
          ]);

          // if not results found, resolve with empty pagination and empty events rather than 404 ERROR
          if (!results?.templates)
            return resolve({
              pagination: {
                total: 0,
                remaining: 0,
                hasMore: false,
                resultCount: 0,
              },
              templates: [],
            });

          templates = results.templates;
          total = results.total.total;
          break;

        // Search load from client
        case TEMPLATES_SEARCH_ACTIONS.SEARCH:
          console.log("=== Type: Search");
          [results] = await Template.aggregate([
            {
              $search: {
                index: DATABASE_SEARCH_INDEXES.TEMPLATES,
                text: {
                  query: filters.term,
                  path: "name",
                },
              },
            },
            {
              $match: {
                isDeleted: false,
                visible: true,
              },
            },
            {
              $facet: {
                templates: [
                  { $sort: { used: -1, name: 1 } },
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
                                  avatar: 1,
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
                      isDeleted: 0,
                      __v: 0,
                    },
                  },
                ],
                total: [
                  {
                    $match: {
                      isDeleted: false,
                      visible: true,
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
          if (!results?.templates)
            return resolve({
              pagination: {
                total: 0,
                remaining: 0,
                hasMore: false,
                resultCount: 0,
              },
              templates: [],
            });

          templates = results.templates;
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
          resultCount: templates.length,
        },
        templates,
      };

      console.log(util.inspect(results, false, 2, true));

      return resolve(result);
    } catch (error) {
      console.log(error);
      return reject(new Error(errorMessages.INTERNAL));
    }
  });
}

async function getMyTemplates(skip, limit, meta, userid) {
  // Skip validation
  skip = Number(skip) ? Number(skip) : 0;
  skip = skip < 0 ? 0 : skip;
  // Limit validation
  limit = Number(limit) ? Number(limit) : 8;
  limit = limit < 0 ? 8 : limit;

  return new Promise(async (resolve, reject) => {
    try {
      //

      const { type, filters } = meta;
      let results, templates, total;

      console.log(filters);

      switch (type) {
        // Initial load from client
        case TEMPLATES_SEARCH_ACTIONS.INITIAL:
          console.log("=== Type: Initial");
          [results] = await Template.aggregate([
            {
              $facet: {
                templates: [
                  {
                    $match: {
                      isDeleted: false,
                      owner: ObjectId(userid.toString()),
                    },
                  },
                  { $sort: { used: -1, name: 1 } },
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
                                  uniqueid: 1,
                                  name: 1,
                                  avatar: 1,
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
                      isDeleted: 0,
                      __v: 0,
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
              $unwind: {
                path: "$total",
              },
            },
          ]);

          // if not results found, resolve with empty pagination and empty events rather than 404 ERROR
          if (!results?.templates)
            return resolve({
              pagination: {
                total: 0,
                remaining: 0,
                hasMore: false,
                resultCount: 0,
              },
              templates: [],
            });

          templates = results.templates;
          total = results.total.total;
          break;

        // Search load from client
        case TEMPLATES_SEARCH_ACTIONS.SEARCH:
          console.log("=== Type: Search");
          [results] = await Template.aggregate([
            {
              $search: {
                index: DATABASE_SEARCH_INDEXES.TEMPLATES,
                text: {
                  query: filters.term,
                  path: "name",
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
                templates: [
                  { $sort: { used: -1, name: 1 } },
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
                            displayName: 1,
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
                                  avatar: 1,
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
                      isDeleted: 0,
                      __v: 0,
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
          if (!results?.templates)
            return resolve({
              pagination: {
                total: 0,
                remaining: 0,
                hasMore: false,
                resultCount: 0,
              },
              templates: [],
            });

          templates = results.templates;
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
          resultCount: templates.length,
        },
        templates,
      };

      console.log(util.inspect(results, false, 4, true));

      return resolve(result);
    } catch (error) {
      console.log(error);
      return reject(new Error(errorMessages.INTERNAL));
    }
  });
}

async function getPublicTemplates() {
  return new Promise(async (resolve, reject) => {
    try {
      const templates = await Template.find(
        { isDeleted: false, visible: true },
        { _id: 0, __v: 0, isDeleted: 0, visible: 0, owner: 0 }
      );

      // TODO: Query the owner and attach it to each template (MAYBE)

      resolve(templates);
    } catch (error) {
      reject(new Error(errorMessages.INTERNAL));
    }
  });
}

async function getTemplateById(uniqueid) {
  return new Promise(async (resolve, reject) => {
    try {
      // prettier-ignore
      const template = await Template.findOne(
        {
          isDeleted: false,
          uniqueid: uniqueid,
        },
        {
          '_id': 0,
          '__v': 0,
          'isDeleted': 0,
          'owner': 0,
        }
      );
      if (!template) return reject(new Error(errorMessages.NOT_FOUND));
      resolve(template);
    } catch (error) {
      reject(new Error(errorMessages.INTERNAL));
    }
  });
}

async function deleteTemplateById(userid, uniqueid) {
  return new Promise(async (resolve, reject) => {
    try {
      // prettier-ignore
      const template = await Template.findOneAndUpdate(
        {
          owner: userid,
          isDeleted: false,
          uniqueid: uniqueid,
        },
        {
          isDeleted: true,
        }
      );
      if (!template) return reject(new Error(errorMessages.NOT_FOUND));
      resolve();
    } catch (error) {
      reject(new Error(errorMessages.INTERNAL));
    }
  });
}

async function updateTemplateById(userid, uniqueid, data) {
  return new Promise(async (resolve, reject) => {
    try {
      // prettier-ignore
      await Webhook.updateOne(
        {
          owner: userid,
          isDeleted: false,
          uniqueid: uniqueid,
        }, {
          server: data.server,
          channel: data.channel,
          webhookUrl: data.webhookUrl
        }
      );
      resolve();
    } catch (error) {
      reject(new Error(errorMessages.INTERNAL));
    }
  });
}

async function incTemplateUsedById(userid, uniqueid) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("====== template controller: ");
      console.log("userid: ", userid);
      console.log("uniqueid: ", uniqueid);
      // prettier-ignore
      const updated = await Template.updateOne(
        {
          isDeleted: false,
          uniqueid: uniqueid,
        },
        {
          $inc: { used: 1 },
        }
      );
      console.log("updated: ", updated);
      resolve();
    } catch (error) {
      reject(new Error(errorMessages.INTERNAL));
    }
  });
}

module.exports = {
  newTemplate,
  exploreTemplates,
  getMyTemplates,
  getPublicTemplates,
  getTemplateById,
  deleteTemplateById,
  updateTemplateById,
  incTemplateUsedById,
};
