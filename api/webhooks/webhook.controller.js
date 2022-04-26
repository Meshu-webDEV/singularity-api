const { Types } = require('mongoose');
const { errorMessages, WEBHOOKS } = require('../../lib/constants');
const { subtractHoursFromNow, getUtc } = require('../../lib/dates');
const { createUniqueId } = require('../../lib/utils');
const { galacticoPing } = require('../../Galactico/notifier');

/**
 * @type {import('mongoose').Collection}
 */
const Webhook = require('./webhook.model');

async function newDiscordWebhook(userid, data) {
  return new Promise(async (resolve, reject) => {
    try {
      const uniqueid = await createUniqueId();

      const total = await Webhook.countDocuments({
        owner: Types.ObjectId(userid),
        isDeleted: false,
      });

      if (total + 1 >= WEBHOOKS.PER_ACCOUNT_LIMIT)
        return reject(new Error(errorMessages.FORBIDDEN_EXCEED_LIMIT_WEBHOOKS));

      const createdWebhook = await new Webhook({
        ...data,
        uniqueid,
        owner: Types.ObjectId(userid),
      }).save();

      return resolve();
    } catch (error) {
      // console.log(error);
      reject(new Error(errorMessages.INTERNAL));
    }
  });
}

async function getDiscordWebhooks(userid) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log(userid)
      const webhooks = await Webhook.find(
        { owner: Types.ObjectId(userid.toString()), isDeleted: false },
        { '__v': 0, 'isDeleted': 0 }
      );
      console.log(webhooks)
      resolve(webhooks);
    } catch (error) {
      reject(new Error(errorMessages.INTERNAL));
    }
  });
}

async function getDiscordWebhookById(userid, ids) {
  return new Promise(async (resolve, reject) => {
    try {
      // prettier-ignore
      const webhooks = await Webhook.find({
        owner: userid,
        isDeleted: false,
        uniqueid: { $in: ids },
      }, {
        '__v': 0, 'lastPinged': 0, 'isDeleted': 0, 'owner': 0, '_id': 0
      });
      if (!webhooks.length) return reject(new Error(errorMessages.NOT_FOUND));
      resolve(webhooks);
    } catch (error) {
      reject(new Error(errorMessages.INTERNAL));
    }
  });
}

async function deleteDiscordWebhookById(userid, uniqueid) {
  return new Promise(async (resolve, reject) => {
    try {
      // prettier-ignore
      const webhook = await Webhook.findOneAndUpdate(
        {
          owner: userid,
          isDeleted: false,
          uniqueid: uniqueid,
        },
        {
          isDeleted: true,
        }
      );
      resolve();
    } catch (error) {
      reject(new Error(errorMessages.INTERNAL));
    }
  });
}

async function updateDiscordWebhookById(userid, uniqueid, data) {
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

async function pingDiscordChannel(userid, uniqueid) {
  return new Promise(async (resolve, reject) => {
    try {
      const channel = await Webhook.findOne({
        owner: userid,
        isDeleted: false,
        uniqueid: uniqueid,
        lastPinged: {
          $lte: subtractHoursFromNow(24),
        },
      });

      if (!channel)
        return reject(new Error(errorMessages.FORBIDDEN_EXCEED_LIMIT_PINGS));

      await galacticoPing(channel.webhookUrl).catch(e => {
        throw new Error(e.message);
      });
      await Webhook.updateOne(
        {
          owner: userid,
          isDeleted: false,
          uniqueid: uniqueid,
        },
        {
          lastPinged: getUtc(new Date()),
        }
      );
      resolve(channel);
    } catch (error) {
      reject(new Error(error.message || errorMessages.INTERNAL));
    }
  });
}

module.exports = {
  newDiscordWebhook,
  getDiscordWebhooks,
  getDiscordWebhookById,
  deleteDiscordWebhookById,
  updateDiscordWebhookById,
  pingDiscordChannel,
};
