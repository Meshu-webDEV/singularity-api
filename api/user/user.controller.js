const {
  errorMessages,
  USER_ORGANIZATION_STATUS,
} = require("../../lib/constants");
const { subtractHoursFromNow } = require("../../lib/dates");
const {
  createUniqueId,
  hashPassword,
  checkPassword,
  createUniquePassword,
} = require("../../lib/utils");

const Util = require("util");

/**
 * @type {import('mongoose').Collection}
 */
const User = require("./user.model");
/**
 * @type {import('mongoose').Collection}
 */
const Webhook = require("../webhooks/webhook.model");
/**
 * @type {import('mongoose').Collection}
 */
const Organization = require("../organization/organization.model");
/**
 * @type {import('mongoose').Collection}
 */
const Event = require("../event/event.model");
/**
 * @type {import('mongoose').Collection}
 */
const Template = require("../template/template.model");
const { validateDisplayName } = require("../../lib/validation");
const {
  getOrganizationById,
} = require("../organization/organization.controller");
const mail = require("../../lib/mail");
const { Types } = require("mongoose");

/**
 *
 * @param {string} userid the user's id
 * @resolve User object containing the user
 */
async function getUser(userid) {
  return new Promise(async (resolve, reject) => {
    try {
      const [user] = await User.aggregate([
        {
          $match: {
            _id: userid,
          },
        },
        {
          $lookup: {
            from: "organizations",
            localField: "_id",
            foreignField: "owner",
            as: "organization_data",
          },
        },
        {
          $lookup: {
            from: "webhooks",
            localField: "_id",
            foreignField: "owner",
            as: "_webhooks",
          },
        },
        {
          $lookup: {
            from: "templates",
            localField: "_id",
            foreignField: "owner",
            as: "_templates",
          },
        },
        {
          $lookup: {
            from: "events",
            localField: "_id",
            foreignField: "owner",
            as: "_events",
          },
        },
        {
          $addFields: {
            webhooks: { $size: "$_webhooks" },
            events: { $size: "$_events" },
            templates: { $size: "$_templates" },
          },
        },
        {
          $project: {
            _webhooks: 0,
            _templates: 0,
            _events: 0,
            password: 0,
            isDeleted: 0,
            __v: 0,
            "organization_data.__v": 0,
            "organization_data.isDeleted": 0,
          },
        },
        {
          $unwind: {
            path: "$organization_data",
            preserveNullAndEmptyArrays: true,
          },
        },
      ]);

      console.log("===");
      console.log(Util.inspect(user, false, 4, true));
      console.log("===");

      if (!user) reject(new Error(errorMessages.UNAUTHORIZED));

      return resolve(user);
    } catch (error) {
      console.log(error);
      reject(new Error(errorMessages.UNAUTHORIZED));
    }
  });
}

function updateUserOrganizationStatus(userid, status, orgId) {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await User.findOneAndUpdate(
        { _id: userid, isDeleted: false },
        {
          organization_status: status,
          organization: Types.ObjectId(orgId),
        }
      );
      if (!user) return reject(new Error(errorMessages.NOT_FOUND));
      return resolve();
    } catch (error) {
      return reject(new Error(errorMessages.INTERNAL));
    }
  });
}

function editDisplayName(userid, username, displayName) {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await User.findOne({ _id: userid, isDeleted: false });

      // prettier-ignore
      const isValid = await validateDisplayName(displayName, user.altered ? username.slice(0, -4) : username);

      // prettier-ignore
      if (!isValid) return reject(new Error(errorMessages.VALIDATE_DISPLAYNAME));
      await User.updateOne(
        { _id: userid, isDeleted: false },
        { displayName: displayName }
      );
      return resolve();
    } catch (error) {
      return reject(new Error(errorMessages.INTERNAL));
    }
  });
}

function changePassword(userid, { currentPassword, newPassword }) {
  return new Promise(async (resolve, reject) => {
    try {
      // Find the user and get the hashed pw
      const user = await User.findById(userid);

      if (!user) reject(new Error(errorMessages.UNAUTHORIZED));

      // unhash currentPassword and compare unhashed to found password in db
      const isMatching = await checkPassword(currentPassword, user.password);

      // if not matching return unauthorized
      if (!isMatching)
        return reject(new Error(errorMessages.UNAUTHORIZED_CHANGE_PASSWORD));

      // if matching hash new pw and update on db
      const newHashedPassword = await hashPassword(newPassword);
      await User.updateOne({ _id: userid }, { password: newHashedPassword });

      return resolve();
    } catch (error) {
      console.log(error);
      return reject(new Error(errorMessages.INTERNAL));
    }
  });
}

function findUser(userid) {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await User.findOne(
        { _id: userid, isDeleted: false },
        {
          __v: 0,
          password: 0,
          OAuthId: 0,
          isDeleted: 0,
        }
      ).populate({
        path: "organization",
        select: "name uniqueid status",
      });

      if (!user) return reject(new Error(errorMessages.UNAUTHORIZED));
      return resolve(user.toObject());
    } catch (error) {
      console.log(error);
      return reject(errorMessages.INTERNAL);
    }
  });
}

async function getOrganizerName(id) {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await User.findById(id, {
        _id: 0,
        username: 1,
      });

      if (!user) throw Error(errorMessages.NOT_FOUND);

      return resolve(user);
    } catch (error) {
      console.log(error);
      reject(error || new Error(errorMessages.UNAUTHORIZED));
    }
  });
}

function resetPassword(email) {
  return new Promise(async (resolve, reject) => {
    try {
      // find user
      const user = await User.findOne({ email });

      if (!user) return reject(new Error(errorMessages.EMAIL_NOT_FOUND));

      const { username, email: user_email, _id } = user.toObject();

      // New random password
      const password = await createUniquePassword(21);

      // Hash
      const hashedPassword = await hashPassword(password);

      // user_email
      await mail.password_reset(user_email, username, password);

      // update DB
      await User.updateOne(
        { _id: Types.ObjectId(_id.toString()) },
        { password: hashedPassword }
      );

      // resolve
      return resolve();
    } catch (error) {
      console.log(error);
      return reject(new Error(errorMessages.INTERNAL));
    }
  });
}

module.exports = {
  getUser,
  updateUserOrganizationStatus,
  findUser,
  editDisplayName,
  getOrganizerName,
  resetPassword,
  changePassword,
};
