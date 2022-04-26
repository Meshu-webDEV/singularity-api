/**
 * @type {import('mongoose').Collection}
 */
const {
  errorMessages,
  USER_ORGANIZATION_STATUS,
} = require("../../../lib/constants");
const { normalize } = require("../../../lib/utils");
const User = require("../../user/user.model");

// id, displayName, emails[{value: ''}]
function findOrCreateUser(user) {
  return new Promise(async (resolve, reject) => {
    try {
      // Check if OAuthId exists
      const OAuthUser = await User.findOne(
        {
          OAuthId: user.id,
          isDeleted: false,
        },
        { __v: 0, password: 0 }
      );

      // console.log("== GOOGLE USER:", user);
      // console.log("== DATABASE USER:", OAuthUser);

      if (OAuthUser) return resolve(OAuthUser);

      // If OAuthId is not present, check if the email is in use
      const existingEmail = await User.findOne({
        email: normalize(user.emails[0].value),
      });
      if (existingEmail) throw Error(errorMessages.USER_ALREADY_EXIST);

      const createdUser = await User.findOneAndUpdate(
        { OAuthId: user.id },
        {
          OAuthId: user.id,
          username: normalize(user.displayName),
          displayName: normalize(user.displayName),
          email: normalize(user.emails[0].value),
          strategy: "provider",
          organization_status: USER_ORGANIZATION_STATUS.DEFAULT,
          createdAt: new Date(),
          isDeleted: false,
          active: true,
          discordWebhooks: [],
        },
        {
          new: true,
          upsert: true,
          returnDocument: "after",
          projection: { __v: 0, password: 0 },
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
