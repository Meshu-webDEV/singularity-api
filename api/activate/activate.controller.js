const { Types } = require('mongoose');
const { errorMessages } = require('../../lib/constants');

const { createUniqueId } = require('../../lib/utils');

/**
 * @type {import('mongoose').Collection}
 */
const User = require('../user/user.model');

/**
 * @type {import('mongoose').Collection}
 */
const Activation = require('./activate.model');

/**
 *
 * @param {String} userid
 * @returns {Promise<String>} The key referenced by userid
 */
async function newActivationRecord(userid) {
  return new Promise(async (resolve, reject) => {
    try {
      // Create a key
      const key = await createUniqueId(21);

      // check if userid is already existent
      const existentUserid = await Activation.findOne({ userid: userid });
      if (existentUserid) return reject(new Error(errorMessages.ALREADY_EXIST));

      // Create & save a new record
      await new Activation({
        activation_key: key,
        userid: Types.ObjectId(userid),
      }).save();

      return resolve(key);
    } catch (error) {
      console.log(error);
      reject(new Error(errorMessages.UNAUTHORIZED));
    }
  });
}

function activateAccount(key) {
  return new Promise(async (resolve, reject) => {
    try {
      // look up the key in activations documents
      const record = await Activation.findOne({
        activation_key: key,
      });

      // if not found
      if (!record) return resolve({ status: 'expired' });

      await User.updateOne(
        { _id: Types.ObjectId(record.userid.toString()) },
        { active: true }
      );

      return resolve({ status: 'activated' });
    } catch (error) {
      console.log(error);
    }
  });
}

function isActivationRecordValid(userid) {
  return new Promise(async (resolve, reject) => {
    try {
      // look up the key in activations documents
      const record = await Activation.findOne({
        userid: Types.ObjectId(userid),
      });

      // if not found
      if (!record) return resolve(false);

      return resolve(record.toObject());
    } catch (error) {
      console.log(error);
      reject(new Error(errorMessages.INTERNAL));
    }
  });
}

module.exports = {
  newActivationRecord,
  activateAccount,
  isActivationRecordValid,
};
