const Yup = require('yup');
const { normalize } = require('./utils');

module.exports = {
  displayName: Yup.string().test(
    'display-name',
    'Must match username. Only Dashes, spaces or capitalizations is allowed',
    (displayName, { options: { context } }) =>
      normalize(context.username) === normalize(displayName.replace(/-| /g, ''))
  ),
};
