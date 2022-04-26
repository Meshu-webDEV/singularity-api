const { Types } = require('mongoose');
const util = require('util');
const {
  errorMessages,
  orgApplicationStatus,
  eventStatus,
  USER_ORGANIZATION_STATUS,
} = require('../../lib/constants');
const { createUniqueId } = require('../../lib/utils');

/**
 * @type {import('mongoose').Collection}
 */
const Organization = require('./organization.model');
/**
 * @type {import('mongoose').Collection}
 */
const User = require('../user/user.model');

async function newOrganization(userid, data) {
  return new Promise(async (resolve, reject) => {
    try {
      const uniqueid = await createUniqueId();

      // Check if there is an already created application
      const existentOrg = await Organization.findOne({
        owner: Types.ObjectId(userid.toString()),
        isDeleted: false,
      });

      if (existentOrg)
        await Organization.updateMany(
          { owner: Types.ObjectId(userid.toString()) },
          { isDeleted: true }
        );

      const createdOrganization = await new Organization({
        ...data,
        uniqueid,
        owner: Types.ObjectId(userid),
      }).save();

      return resolve({
        id: createdOrganization._id,
      });
    } catch (error) {
      // console.log(error);
      reject(new Error(errorMessages.INTERNAL));
    }
  });
}

async function getOrganizationById(id) {
  return new Promise(async (resolve, reject) => {
    try {
      const organization = await Organization.findById(
        { _id: id, isDeleted: false },
        { '_id': 0, '__v': 0 }
      );
      return resolve(organization.toObject());
    } catch (error) {
      console.log(error);
      reject(new Error(errorMessages.INTERNAL));
    }
  });
}

async function getOrganizationByUniqueid(uniqueid) {
  return new Promise(async (resolve, reject) => {
    try {
      const [organization] = await Organization.aggregate([
        {
          '$match': {
            uniqueid: uniqueid,
            isDeleted: false,
            status: orgApplicationStatus.APPROVED,
          },
        },
        {
          '$lookup': {
            'from': 'events',
            'let': { 'user_id': '$owner' },
            'pipeline': [
              {
                '$match': {
                  '$expr': {
                    '$eq': ['$owner', '$$user_id'],
                  },
                },
              },
              {
                '$match': { 'isDeleted': false, 'isPublic': true },
              },
              { '$sort': { 'datetime': 1 } },
              { '$limit': 8 },
              {
                '$project': {
                  'owner': 1,
                  'name': 1,
                  'uniqueid': 1,
                  'datetime': 1,
                  'rounds': 1,
                  'currentRound': 1,
                  'status': 1,
                  'hasPrizepool': 1,
                  'prizepool': 1,
                  'prizepoolCurrency': 1,
                  'isPublic': 1,
                },
              },
            ],
            'as': 'recent_events',
          },
        },
        {
          '$lookup': {
            'from': 'users',
            'let': { 'user_id': '$owner' },
            'pipeline': [
              {
                '$match': {
                  '$expr': {
                    '$eq': ['$_id', '$$user_id'],
                  },
                },
              },
              {
                '$project': {
                  'displayName': 1,
                  '_id': 1,
                },
              },
            ],
            'as': 'owner',
          },
        },
        {
          '$unwind': {
            'path': '$owner',
            'preserveNullAndEmptyArrays': true,
          },
        },
        // ROOT LEVEL PROJECTION
        {
          '$project': {
            '__v': 0,
            'isDeleted': 0,
          },
        },
      ]);

      console.log('=== Organization: ');
      console.log(util.inspect(organization, true, 3, true));

      if (!organization) return reject(new Error(errorMessages.NOT_FOUND));

      resolve({
        status: organization.status,
        data: organization,
      });
    } catch (error) {
      console.log(error);
      reject(new Error(errorMessages.INTERNAL));
    }
  });
}

async function getOrganizationByOwnerId(ownerid) {
  return new Promise(async (resolve, reject) => {
    try {
      const [organization] = await Organization.aggregate([
        {
          '$match': {
            owner: ownerid,
            isDeleted: false,
          },
        },
        {
          '$lookup': {
            'from': 'events',
            'let': { 'user_id': '$owner' },
            'pipeline': [
              {
                '$match': {
                  '$expr': {
                    '$eq': ['$owner', '$$user_id'],
                  },
                },
              },
              {
                '$match': { 'isDeleted': false, 'isPublic': true },
              },
              { '$sort': { 'datetime': 1 } },
              { '$limit': 8 },
              {
                '$project': {
                  'owner': 1,
                  'name': 1,
                  'uniqueid': 1,
                  'datetime': 1,
                  'rounds': 1,
                  'currentRound': 1,
                  'status': 1,
                  'hasPrizepool': 1,
                  'prizepool': 1,
                  'prizepoolCurrency': 1,
                  'isPublic': 1,
                },
              },
            ],
            'as': 'recent_events',
          },
        },
        {
          '$lookup': {
            'from': 'users',
            'let': { 'user_id': '$owner' },
            'pipeline': [
              {
                '$match': {
                  '$expr': {
                    '$eq': ['$_id', '$$user_id'],
                  },
                },
              },
              {
                '$project': {
                  'displayName': 1,
                  '_id': 1,
                },
              },
            ],
            'as': 'owner',
          },
        },
        {
          '$unwind': {
            'path': '$owner',
            'preserveNullAndEmptyArrays': true,
          },
        },
        // ROOT LEVEL PROJECTION
        {
          '$project': {
            '__v': 0,
            'isDeleted': 0,
          },
        },
      ]);

      // const organization = await Organization.findOne(
      //   { owner: ownerid, isDeleted: false },
      //   { '__v': 0, 'isDeleted': 0 }
      // );

      console.log('=== Controller org:');
      console.log(organization);

      if (!organization)
        return resolve({
          status: orgApplicationStatus.DEFAULT,
          data: null,
        });

      // const recentEvents = getMyRecentEvents

      if (
        organization.status === orgApplicationStatus.DEFAULT ||
        organization.status === orgApplicationStatus.PENDING
      )
        return resolve({
          status: organization.status,
          data: null,
        });

      if (organization.status === orgApplicationStatus.REJECTED)
        return resolve({
          status: organization.status,
          data: organization.rejection_reason,
        });

      return resolve({
        status: organization.status,
        data: organization,
      });
    } catch (error) {
      console.log(error);
      reject(new Error(errorMessages.INTERNAL));
    }
  });
}

async function resetOrganizationRejection(userid) {
  return new Promise(async (resolve, reject) => {
    try {
      // check if status is actually rejected before doing anything

      const user = await User.findOneAndUpdate({ _id: userid }, [
        { $unset: ['organization'] },
        {
          $set: {
            'organization_status': USER_ORGANIZATION_STATUS.DEFAULT,
          },
        },
      ]);

      if (!user) reject(new Error(errorMessages.UNAUTHORIZED));

      console.log(user);

      await Organization.deleteOne({ _id: user.toObject().organization });
      await User.updateOne(
        { _id: userid },
        { status: orgApplicationStatus.DEFAULT, rejection_reason: '' }
      );

      return resolve();
    } catch (error) {
      console.log(error);
      reject(new Error(errorMessages.INTERNAL));
    }
  });
}

async function editOrganizationBio(userid, id, bio) {
  return new Promise(async (resolve, reject) => {
    try {
      // Check if owner
      const organization = await Organization.findOneAndUpdate(
        {
          _id: Types.ObjectId(id.toString()),
          owner: Types.ObjectId(userid.toString()),
          isDeleted: false,
        },
        { about: bio }
      );
      if (!organization) return reject(new Error(errorMessages.UNAUTHORIZED));

      return resolve();
    } catch (error) {
      console.log(error);
      return reject(new Error(errorMessages.INTERNAL));
    }
  });
}

module.exports = {
  newOrganization,
  getOrganizationByOwnerId,
  getOrganizationById,
  getOrganizationByUniqueid,
  resetOrganizationRejection,
  editOrganizationBio,
};
