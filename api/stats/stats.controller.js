const { errorMessages } = require('../../lib/constants');

/**
 * @type {import('mongoose').Collection}
 */
const Event = require('../event/event.model');
/**
 * @type {import('mongoose').Collection}
 */
const User = require('../user/user.model');

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

function getUsersCount() {
  return new Promise(async (resolve, reject) => {
    try {
      const total = await User.countDocuments({});

      return resolve(total);
    } catch (error) {
      console.log(error);
      return reject(new Error(errorMessages.INTERNAL));
    }
  });
}

module.exports = {
  getEventsCount,
  getUsersCount,
};
