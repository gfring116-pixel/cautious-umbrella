module.exports = {
  name: 'clientReady',
  once: true,
  execute(client) {
    console.log(`✅  Logged in as ${client.user.tag}`);
    console.log(`📋  Guilds: ${client.guilds.cache.size}`);
    client.user.setPresence({
      activities: [{ name: 'Rekrut Applications', type: 3 }],
      status: 'online',
    });
  },
};
