const { errorMessages } = require('../../lib/constants');
const unset = require('lodash.unset');

// const Team = require('./team.model');
const Team = require('./team.model');
const { createUniqueId } = require('../../lib/utils');

function newTeam(team, creator) {
  // TODO: Validate event object
  // prettier-ignore
  const { name, players = [] } = team;

  return new Promise(async (resolve, reject) => {
    //

    const initializedTeam = {
      name,
      creator,
      isDeleted: false,
      players,
    };

    try {
      const createdNewTeam = await new Team(initializedTeam).save();

      return resolve(createdNewTeam);
    } catch (error) {
      console.log(error);
      return reject(new Error(errorMessages.INTERNAL));
    }
  });
}

function getAllTeams(creator) {
  return new Promise(async (resolve, reject) => {
    try {
      const teams = await Team.find(
        { creator },
        { '_id': 1, 'name': 1, 'players': 1, 'uniqueid': 1, 'creatable': 1 }
      ).sort({ name: 'asc' });
      return resolve(teams);
    } catch (error) {
      console.log(error);
      return reject(errorMessages.INTERNAL);
    }
  });
}

function multiNewTeams(teams) {
  // TODO: Validate event object
  // prettier-ignore

  return new Promise(async (resolve, reject) => {
    //
    try {
      // if teams is an empty array, return
      if (teams.length === 0) return teams;
      
      const teamsToCreate = await Promise.all(
        teams.map(async team => {
          return { ...team, creatable: false, uniqueid: await createUniqueId(6) };
        })
      );

      const createdNewTeams = await Team.insertMany(teamsToCreate);
      // Sanitize created teams
      const sanitizedTeams = createdNewTeams.map(team => {
        const sanitizedTeam = team.toObject();
        delete sanitizedTeam.isDeleted;
        delete sanitizedTeam.creator;
        delete sanitizedTeam.__v;
        return sanitizedTeam;
      });
      resolve(sanitizedTeams);
    } catch (error) {
      console.log(error);
      return reject(new Error(errorMessages.INTERNAL));
    }
  });
}

module.exports = {
  newTeam,
  multiNewTeams,
  getAllTeams,
};
