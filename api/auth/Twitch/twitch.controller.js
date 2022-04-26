/**
 * @type {import('mongoose').Collection}
 */
const {
  errorMessages,
  USER_ORGANIZATION_STATUS,
} = require('../../../lib/constants');
const { normalize } = require('../../../lib/utils');
const User = require('../../user/user.model');

// id, login, display_name, email
function findOrCreateUser(user) {
  return new Promise(async (resolve, reject) => {
    try {
      // Check if OAuthId exists
      console.log(user);
      const OAuthUser = await User.findOne(
        {
          OAuthId: user.id,
          isDeleted: false,
        },
        { '__v': 0, 'password': 0 }
      );

      // Return found user
      if (OAuthUser) return resolve(OAuthUser);

      // Check if email already in use
      const existingUser = await User.findOne({
        email: normalize(user.email),
      });
      if (existingUser) throw Error(errorMessages.USER_ALREADY_EXIST);

      const createdUser = await User.findOneAndUpdate(
        { OAuthId: user.id },
        {
          OAuthId: user.id,
          username: normalize(user.login),
          displayName: normalize(user.login),
          email: normalize(user.email),
          strategy: 'provider',
          organization_status: USER_ORGANIZATION_STATUS.DEFAULT,
          createdAt: new Date(),
          isDeleted: false,
          active: true,
          discordWebhooks: [],
        },
        {
          new: true,
          upsert: true,
          returnDocument: 'after',
          projection: { '__v': 0, 'password': 0 },
        }
      );

      return resolve(createdUser);
    } catch (error) {
      console.log(error);
      return reject(null);
    }
  });
}

module.exports = {
  findOrCreateUser,
};
