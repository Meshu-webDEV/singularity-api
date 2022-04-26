const {
  errorMessages,
  orgApplicationStatus,
  USER_ORGANIZATION_STATUS,
} = require('../../lib/constants');
const { subtractHoursFromNow } = require('../../lib/dates');
const {
  createUniqueId,
  hashPassword,
  checkPassword,
} = require('../../lib/utils');
const {
  getOrganizationById,
} = require('../organization/organization.controller');

/**
 * @type {import('mongoose').Collection}
 */
const Admin = require('./admin.model');
/**
 * @type {import('mongoose').Collection}
 */
const Organization = require('../organization/organization.model');
/**
 * @type {import('mongoose').Collection}
 */
const User = require('../user/user.model');

/**
 *
 * @param {string} adminId the admin's id
 * @resolve Admin object
 */
async function getAdmin(adminUsername, adminPassword) {
  return new Promise(async (resolve, reject) => {
    try {
      const existingAdmin = await Admin.findOne(
        { admin_name: adminUsername },
        {
          '_id': 0,
          '__v': 0,
          'isDeleted': 0,
        }
      );

      if (!existingAdmin) return reject(new Error(errorMessages.UNAUTHORIZED));

      // Check if passwords are matching
      const isMatching = await checkPassword(
        adminPassword,
        existingAdmin.password
      );

      if (!isMatching) return reject(new Error(errorMessages.INVALID_SIGNIN));

      return resolve(existingAdmin);
    } catch (error) {
      console.log(error);
      reject(new Error(errorMessages.UNAUTHORIZED));
    }
  });
}

async function createAdmin(admin) {
  return new Promise(async (resolve, reject) => {
    try {
      const hashedPassword = await hashPassword(admin.password);
      const newAdmin = new Admin({
        admin_name: admin.username,
        password: hashedPassword,
      });
      const createdAdmin = await new Admin(newAdmin).save();

      return resolve(createdAdmin);
    } catch (error) {
      console.log(error);
      reject(new Error(errorMessages.INTERNAL));
    }
  });
}

async function getOrganizationsApplications(skip, sort, limit) {
  return new Promise(async (resolve, reject) => {
    try {
      const results = await Organization.aggregate([
        {
          '$facet': {
            'applications': [
              { '$skip': skip },
              { '$limit': limit },
              { '$sort': { 'createdAt': sort === 'asc' ? 1 : -1 } },
            ],
            'total': [{ '$count': 'total' }],
          },
        },
      ]);

      return resolve({
        applications: { ...results[0] }.applications,
        total: { ...results[0] }.total[0]?.total,
      });
    } catch (error) {
      console.log(error);
      return reject(new Error(errorMessages.INTERNAL));
    }
  });
}

async function getOrganizationByUniqueid(uniqueid) {
  return new Promise(async (resolve, reject) => {
    try {
      const organization = await Organization.findOne(
        { uniqueid: uniqueid },
        { '_id': 0, '__v': 0 }
      );
      return resolve(organization.toObject());
    } catch (error) {
      console.log(error);
      reject(new Error(errorMessages.INTERNAL));
    }
  });
}

async function rejectOrganizationApplication(uniqueid, reason = '', owner) {
  return new Promise(async (resolve, reject) => {
    try {
      await Organization.updateOne(
        { uniqueid: uniqueid },
        { status: orgApplicationStatus.REJECTED, rejection_reason: reason }
      );

      console.log('userid: ', owner);

      await User.updateOne(
        { _id: owner },
        { organization_status: USER_ORGANIZATION_STATUS.REJECTED }
      );

      return resolve();
    } catch (error) {
      console.log(error);
      reject(new Error(errorMessages.INTERNAL));
    }
  });
}

async function approveOrganizationApplication(uniqueid, userid) {
  return new Promise(async (resolve, reject) => {
    try {
      const isCurrentApplication = await Organization.findOneAndUpdate(
        { uniqueid: uniqueid, isDeleted: false },
        { status: orgApplicationStatus.APPROVED }
      );

      if (isCurrentApplication)
        await User.updateOne(
          { _id: userid },
          { organization_status: USER_ORGANIZATION_STATUS.APPROVED }
        );
      return resolve();
    } catch (error) {
      console.log(error);
      reject(new Error(errorMessages.INTERNAL));
    }
  });
}

function getUserById(userid) {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await User.findById(userid);

      if (!user) throw Error(errorMessages.NOT_FOUND);

      return resolve(user);
    } catch (error) {
      console.log(error);
      reject(error || new Error(errorMessages.UNAUTHORIZED));
    }
  });
}
module.exports = {
  getAdmin,
  getUserById,
  createAdmin,
  getOrganizationsApplications,
  getOrganizationByUniqueid,
  rejectOrganizationApplication,
  approveOrganizationApplication,
};
