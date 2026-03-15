const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const fs     = require('fs');
const path   = require('path');
const http   = require('http');
const https  = require('https');
const config = require('./config');
const { connect } = require('./utils/db');

const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bot is running!');
}).listen(PORT, () => console.log(`✅  HTTP server on port ${PORT}`));

const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
setInterval(() => {
  if (!RENDER_URL) return;
  https.get(RENDER_URL, (res) => {
    console.log(`🔁  Self-ping OK (${res.statusCode})`);
  }).on('error', (err) => {
    console.warn(`⚠️  Self-ping failed: ${err.message}`);
  });
}, 4 * 60 * 1000);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.GuildMember],
  rest: { timeout: 60000 },
  failIfNotExists: false,
});

client.commands = new Collection();

const commandFiles = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(path.join(__dirname, 'commands', file));
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
    console.log(`  ✅ Command: /${command.data.name}`);
  }
}

const eventFiles = fs.readdirSync('./events').filter(f => f.endsWith('.js'));
for (const file of eventFiles) {
  const event = require(path.join(__dirname, 'events', file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
  console.log(`  ✅ Event: ${event.name}`);
}

if (!config.token) { console.error('❌  BOT_TOKEN missing!'); process.exit(1); }
if (!process.env.MONGODB_URI) { console.error('❌  MONGODB_URI missing!'); process.exit(1); }

console.log('🔄  Attempting Discord login...');
console.log('🔑  Token starts with:', config.token?.substring(0, 10));



(async () => {
  try {
    client.on('error', (err) => console.error('❌ Client error:', err.message));
client.on('warn', (msg) => console.warn('⚠️ Warning:', msg));
client.on('shardDisconnect', (event) => console.error('🔴 Disconnected:', event));
client.on('shardReconnecting', () => console.log('🔄 Reconnecting...'));
client.on('shardResume', () => console.log('✅ Resumed connection'));
    await connect();
    console.log('🔄  Logging into Discord...');
    await client.login(config.token);
    console.log('✅  Login called successfully');
  } catch (err) {
    console.error('❌  Startup failed:', err.message);
    console.error(err);
    process.exit(1);
  }
})();
