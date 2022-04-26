require('dotenv').config();
const mongoose = require('mongoose');

const URI = process.env.MONGO_URI;

function connect() {
  return new Promise(async (resolve, reject) => {
    try {
      const { connection } = await mongoose.connect(URI, {
        keepAlive: true,
        keepAliveInitialDelay: 8000,
      });
      resolve(connection);
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = connect;
