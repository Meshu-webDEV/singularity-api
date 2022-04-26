const isEmpty = require('lodash.isempty');
const { errorMessages } = require('../../lib/constants');

const { jwtSign, jwtVerify, jwtTokenPayload } = require('../../lib/jwt');
const { hashPassword, checkPassword } = require('../../lib/utils');
const { getUser } = require('../user/user.controller');

const User = require('../user/user.model');

function isAuthorized(token) {
  return new Promise(async (resolve, reject) => {
    try {
      await jwtVerify(token);
      const { userid } = await jwtTokenPayload(token);
      const user = await getUser(userid);

      if (isEmpty(user)) throw new Error(errorMessages.UNAUTHORIZED);

      return resolve({ token, username: user.username });
    } catch (error) {
      console.log(error);
      console.log('Error at isAuthorized - Not authorized');
      return reject(error);
    }
  });
}

function signUp(user) {
  return new Promise(async (resolve, reject) => {
    try {
      // TODO: validate info

      // Check if username already exist
      const existingUser = await User.findOne({ username: user.username });
      if (existingUser) throw Error(errorMessages.USER_ALREADY_EXIST);

      // User save
      const hashedPassword = await hashPassword(user.password);
      const newUser = new User({
        username: user.username,
        password: hashedPassword,
      });
      const createdUser = await newUser.save();

      // Token creation
      const token = await jwtSign({
        username: createdUser.username,
        userid: createdUser.id,
      });

      return resolve({ token, username: createdUser.username });
    } catch (error) {
      if (error) return reject(error.message);
      return reject(errorMessages.INTERNAL);
    }
  });
}

function signIn(newUser) {
  return new Promise(async (resolve, reject) => {
    try {
      // TODO: validate info

      // Check if user doesn't exists
      const existingUser = await User.findOne({ username: newUser.username });
      if (!existingUser) throw Error(errorMessages.INVALID_SIGNIN);

      // Check if passwords are matching
      const isMatching = await checkPassword(
        newUser.password,
        existingUser.password
      );

      if (!isMatching) throw Error(errorMessages.INVALID_SIGNIN);

      // Token creation
      const token = await jwtSign({
        username: existingUser.username,
        userid: existingUser.id,
      });

      return resolve({ token: token, username: existingUser.username });
    } catch (error) {
      if (error) return reject(error.message);
      return reject(errorMessages.INTERNAL);
    }
  });
}

module.exports = {
  isAuthorized,
  signUp,
  signIn,
};
