const jwt = require('jsonwebtoken');
const { errorMessages } = require('./constants');

const { JWT_SECRET } = process.env;

function jwtSign(payload, options = { expiresIn: '2weeks' }) {
  return new Promise((resolve, reject) => {
    jwt.sign(payload, JWT_SECRET, options, (err, token) => {
      if (err) return reject(err);

      return resolve(token);
    });
  });
}

function jwtVerify(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) return reject(err);

      return resolve(decoded);
    });
  });
}

/**
 *
 * @param {string} authHeader Accepts the authentication header, "Bearer TOKEN"
 * @returns Token payload
 */
function jwtExtractPayload(authHeader) {
  return new Promise(async (resolve, reject) => {
    try {
      const token = authHeader.split(' ')[1];
      const payload = await jwtVerify(token);

      return resolve(payload);
    } catch (error) {
      return reject(new Error(errorMessages.UNAUTHORIZED));
    }
  });
}
/**
 *
 * @param {string} token Accepts the Token
 * @returns Token payload
 */
function jwtTokenPayload(token) {
  return new Promise(async (resolve, reject) => {
    try {
      const payload = await jwtVerify(token);

      return resolve(payload);
    } catch (error) {
      return reject(new Error(errorMessages.INTERNAL));
    }
  });
}

module.exports = { jwtSign, jwtVerify, jwtExtractPayload, jwtTokenPayload };
