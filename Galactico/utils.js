const sortBy = require('lodash.sortby');

module.exports = {
  notifierRenderStandings: standings => {
    const sortedStandings = sortBy(standings, [s => s.points]).reverse();
    return `${sortedStandings.map(
      (standing, index) =>
        `${'```'}${index + 1}#${index < 9 ? ' ' : ''} ${
          index === 0 ? '🥇' : ''
        }${index === 1 ? '🥉' : ''}${index === 2 ? '🥈' : ''}[${
          standing.name
        }]: ${standing.points}  ${index === 19 ? '' : '\n'}${'```'}`
    )}`.replace(/,/g, '');
  },
};
