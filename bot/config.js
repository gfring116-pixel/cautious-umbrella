// ═══════════════════════════════════════
//   config.js
// ═══════════════════════════════════════
require('dotenv').config();

module.exports = {
  token:    process.env.BOT_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId:  process.env.GUILD_ID,

  serverName: 'North German Confederation',

  colors: {
    accent:    0x2B5EA7,
    success:   0x2ECC71,
    danger:    0xE74C3C,
    warn:      0xF1C40F,
    interview: 0x9B59B6,
    info:      0x3498DB,
  },

  channels: {
    applicationLogs: '1424344616500465684',
    staffReview:     '1426567171571585116',
    auditLog:        '1471097135914025051',
    training:        '1314617304595693640',
  },

  roles: {
    enlisted:  '1424320589178601472',
    staff:     '1350321582467321996',
    divisions: {
      infantry: { id: '1424697278588784670', prefix: 'II.' },
      militia:  { id: '1452712467690946691', prefix: 'ML'  },
      guard:    { id: '1482263357032759411', prefix: 'GK'  },
      navy:     { id: '1446495249970233547', prefix: 'NV'  },
    },
  },

  sus: {
    autoApproveMax: 2,
    flaggedMax:     4,
  },

  autoBlacklistAfter: 3,
};
