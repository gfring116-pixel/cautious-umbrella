// ════════════════════════════════════════════════
//   events/ready.js
// ════════════════════════════════════════════════
module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`\n✅  Logged in as ${client.user.tag}`);
    console.log(`📋  Serving guild: ${client.guilds.cache.first()?.name || 'unknown'}`);
    console.log(`🔧  Commands loaded: ${client.commands.size}\n`);
    client.user.setPresence({
      activities: [{ name: 'Rekrut Applications', type: 3 }],
      status: 'online',
    });
  },
};
