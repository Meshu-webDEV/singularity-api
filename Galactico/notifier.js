const { default: axios } = require('axios');
const { errorMessages } = require('../lib/constants');
const { name, avatarUrl } = require('./constants');

const {
  pingEmbed,
  eventStartEmbed,
  eventProgressEmbed,
  eventEndedEmbed,
} = require('./embeds');

module.exports = {
  galacticoPing: webhookUrl => {
    return new Promise(async (resolve, reject) => {
      try {
        await axios.post(`${webhookUrl}?wait=true`, {
          username: name,
          avatar_url: avatarUrl,
          embeds: [pingEmbed],
        });
        resolve();
      } catch (error) {
        if (error.code === 'ECONNREFUSED')
          return reject(new Error(errorMessages.WEBHOOK_URL_INVALID));
        reject(new Error(errorMessages.INTERNAL));
      }
    });
  },
  galacticoEventStart: (webhookUrls = [], event) => {
    return new Promise(async (resolve, reject) => {
      if (!webhookUrls.length)
        return reject(new Error(errorMessages.MALFORMED_INFO));

      try {
        await Promise.all(
          webhookUrls.map(
            async hook =>
              await axios.post(`${hook}?wait=true`, {
                username: name,
                avatar_url: avatarUrl,
                embeds: [eventStartEmbed(event)],
              })
          )
        );
        resolve();
      } catch (error) {
        console.log(error);
        if (error.code === 'ECONNREFUSED')
          return reject(new Error(errorMessages.WEBHOOK_URL_INVALID));
        reject(new Error(errorMessages.INTERNAL));
      }
    });
  },
  galacticoEventProgress: (webhookUrls = [], event) => {
    return new Promise(async (resolve, reject) => {
      if (!webhookUrls.length)
        return reject(new Error(errorMessages.MALFORMED_INFO));

      try {
        await Promise.all(
          webhookUrls.map(
            async hook =>
              await axios.post(`${hook}?wait=true`, {
                username: name,
                avatar_url: avatarUrl,
                embeds: [eventProgressEmbed(event)],
              })
          )
        );
        resolve();
      } catch (error) {
        console.log(error);
        if (error.code === 'ECONNREFUSED')
          return reject(new Error(errorMessages.WEBHOOK_URL_INVALID));
        reject(new Error(errorMessages.INTERNAL));
      }
    });
  },
  galacticoEventEnded: (webhookUrls = [], event) => {
    return new Promise(async (resolve, reject) => {
      if (!webhookUrls.length)
        return reject(new Error(errorMessages.MALFORMED_INFO));

      try {
        await Promise.all(
          webhookUrls.map(
            async hook =>
              await axios.post(`${hook}?wait=true`, {
                username: name,
                avatar_url: avatarUrl,
                embeds: [eventEndedEmbed(event)],
              })
          )
        );
        resolve();
      } catch (error) {
        console.log(error);
        if (error.code === 'ECONNREFUSED')
          return reject(new Error(errorMessages.WEBHOOK_URL_INVALID));
        reject(new Error(errorMessages.INTERNAL));
      }
    });
  },
};
