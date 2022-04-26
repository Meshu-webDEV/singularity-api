/**
 * @type {import('mongoose').Collection}
 */
const { errorMessages } = require('../../../lib/constants');
const { hashPassword, checkPassword } = require('../../../lib/utils');
const User = require('../../user/user.model');

function createNewUser(user) {
  console.log('=== findOrCreate ===');
  console.log(user);
  return new Promise(async (resolve, reject) => {
    try {
      const existent = await User.findOne({
        $or: [{ username: user.username }, { email: user.email }],
      });
      if (existent) {
        const { username, email } = existent.toObject();
        if (username === user.username && email === user.email)
          return reject(new Error(errorMessages.EMAIL_AND_USERNAME_IN_USE));
        if (username === user.username)
          return reject(new Error(errorMessages.USERNAME_IN_USE));
        if (email === user.email)
          return reject(new Error(errorMessages.EMAIL_IN_USE));

        return reject(new Error(errorMessages.USER_ALREADY_EXIST));
      }

      // User creation
      const hashedPassword = await hashPassword(user.password);
      const newUser = new User({
        username: user.username,
        displayName: user.username,
        password: hashedPassword,
        email: user.email,
      });

      const createdUser = await newUser.save();

      return resolve(createdUser);
    } catch (error) {
      console.log(error);
      return reject(new Error(errorMessages.INTERNAL));
    }
  });
}

function signinUser(user) {
  console.log(user);
  return new Promise(async (resolve, reject) => {
    try {
      // Check if user doesn't exists (i.e wrong info)
      const existingUser = await User.findOne({ email: user.email });
      if (!existingUser) return reject(new Error(errorMessages.INVALID_SIGNIN));

      if (!existingUser.toObject().password)
        return reject(new Error(errorMessages.PASSPORT_AUTH_FAILURE));

      // Check if passwords are matching
      const isMatching = await checkPassword(
        user.password,
        existingUser.password
      );

      if (!isMatching) return reject(new Error(errorMessages.INVALID_SIGNIN));

      if (!existingUser.toObject().active)
        return resolve({ error: 'inactive', user: existingUser });

      return resolve({ error: false, user: existingUser });
    } catch (error) {
      return reject(new Error(errorMessages.INTERNAL));
    }
  });
}

module.exports = {
  createNewUser,
  signinUser,
};
