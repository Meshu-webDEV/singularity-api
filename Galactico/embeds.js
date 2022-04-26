const { USER_ORGANIZATION_STATUS } = require("../lib/constants");
const { title, footer, color, descriptionFooter } = require("./constants");
const { notifierRenderStandings } = require("./utils");

module.exports = {
  pingEmbed: {
    title: title,
    footer: footer,
    color: color,
    description: `‎‏‏‎ ‎
                  \n
                  I made it, its working \u00A0 🚀✨
                  \n 
                  \n
                  ${descriptionFooter}
                  \n
                    `,
  },
  eventStartEmbed: (event) => {
    return {
      title: title,
      footer: footer,
      color: color,
      description: `‎‏‏‎ ‎
                  \n **${event.name}** Has started!
                    - Total Rounds: **${event.rounds}**
                    - Event page: **[${event.name}](https://discord.com)**
                    - Organizer: ${
                      event.owner.organization_status ===
                      USER_ORGANIZATION_STATUS.APPROVED
                        ? event.owner.organization.name
                        : event.owner.displayName
                    } 
                    \n
                    **📊 Standings:**
                    ${"```"}📍 - Current Round: ${
        event.currentRound + 1
      }${"```"}
                    ${notifierRenderStandings(event.standingsTable)}
                  *visit [Event page](https://discord.com) for more*
                  \n
                  Want to get in touch? email me at Sensei@singularity.events
                  \n
                    `,
    };
  },
  eventProgressEmbed: (event) => {
    return {
      title: title,
      footer: footer,
      color: color,
      description: `‎‏‏‎ ‎
                  \n **${event.name}** round ${event.currentRound} has ended!
                    - Total Rounds: **${event.rounds}**
                    - Event page: **[${event.name}](https://discord.com)**
                    - Organizer: ${
                      event.owner.organization_status ===
                      USER_ORGANIZATION_STATUS.APPROVED
                        ? event.owner.organization.name
                        : event.owner.displayName
                    } 
                    \n
                    **📊 Standings:**
                    ${"```"}📍 - Current Round: ${
        event.currentRound + 1
      }${"```"}
                    ${notifierRenderStandings(event.standingsTable)}
                  *visit [Event page](https://discord.com) for more*
                  \n
                  Want to get in touch? email me at Sensei@singularity.events
                  \n
                    `,
    };
  },
  eventEndedEmbed: (event) => {
    return {
      title: title,
      footer: footer,
      color: color,
      description: `‎‏‏‎ ‎
                  \n **${event.name}** has successfully ended!
                      Congratulations to the winners, and better luck for the rest..
                      \n
                    - Event page: **[${event.name}](https://discord.com)**
                    - Organizer: ${
                      event.owner.organization_status ===
                      USER_ORGANIZATION_STATUS.APPROVED
                        ? event.owner.organization.name
                        : event.owner.displayName
                    } 
                    \n
                    **📊 Final standings:**
                    ${notifierRenderStandings(event.standingsTable)}
                  *visit [Event page](https://discord.com) for more*
                  \n
                  Want to get in touch? email me at Sensei@singularity.events
                  \n
                    `,
    };
  },
};
