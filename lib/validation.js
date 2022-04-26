const isEmpty = require('lodash.isempty');
const path = require('path');
const Yup = require('yup');
const { errorMessages } = require('./constants');
/**
 * @type Yup
 */
const { displayName } = require('./ValidationSchemas');

function _isEmpty(data) {
  return isEmpty(data);
}

function validateDisplayName(value, username) {
  return new Promise(async (resolve, reject) => {
    try {
      const isValid = await displayName.isValid(value, {
        context: { username: username },
      });
      resolve(isValid);
    } catch (error) {
      console.log(error);
      reject(new Error(errorMessages.INTERNAL));
    }
  });
}

function validateImage(img) {
  return new Promise((resolve, reject) => {
    try {
      const allowedExt = ['.png', '.jpg', '.jpeg'];
      const allowedMimes = ['image/png', 'image/jpeg'];

      const ext = path.extname(img.originalname);
      const mimeType = img.mimetype;
      if (!allowedExt.includes(ext) || !allowedMimes.includes(mimeType))
        reject(new Error('Not valid'));
      resolve();
    } catch (error) {
      console.log(error);
      reject();
    }
  });
}

module.exports = {
  validateDisplayName,
  _isEmpty,
  validateImage,
};
