const { SEND_GRID, META, CLIENT } = require('./configs');
const sgMail = require('@sendgrid/mail');

module.exports = {
  /**
   * SendGrid Send function.
   * @param {String} to recipient email
   * @param {String} subject email subject
   * @param {String} username username
   * @param {String} activation_link CTA activation link
   * @returns {Promise<any>}
   */
  activation: (
    to,
    username,
    activation_link,
    subject = 'Singularity Email Activation'
  ) => {
    return new Promise(async (resolve, reject) => {
      // SEND
      sgMail.setApiKey(SEND_GRID.KEY);
      try {
        await sgMail.send({
          to,
          from: {
            email: META.ACTIVATION_EMAIL,
            name: 'Singularity',
          },
          dynamicTemplateData: {
            'subject': subject,
            'username': username,
            'activation_link': activation_link,
            'website': CLIENT.URL_ORIGIN,
          },
          templateId: SEND_GRID.TEMPLATES.ACTIVATION,
        });
        resolve();
      } catch (error) {
        console.error(error);
        reject();
      }
    });
  },
  // TODO: Send an email to the user with the new PASSWORD, USE A NEW TEMPLATE ID
  password_reset: (
    to,
    username,
    password,
    subject = 'Singularity Password Reset'
  ) => {
    return new Promise(async (resolve, reject) => {
      // SEND
      sgMail.setApiKey(SEND_GRID.KEY);
      try {
        await sgMail.send({
          to,
          from: {
            email: META.ACTIVATION_EMAIL,
            name: 'Singularity',
          },
          dynamicTemplateData: {
            'subject': subject,
            'username': username,
            'password': password,
            'website': CLIENT.URL_ORIGIN,
          },
          templateId: SEND_GRID.TEMPLATES.PASSWORD_RESET,
        });
        resolve();
      } catch (error) {
        console.error(error);
        reject();
      }
    });
  },
};
