require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const { connect } = require('./utils/db');

// ── Keep-alive HTTP server ────────────────────
const PORT = process.env.PORT || 3000;
http.createServer((_, res) => { res.writeHead(200); res.end('online'); })
  .listen(PORT, () => console.log(`✅  HTTP on port ${PORT}`));

// ── Self-ping to stay alive ───────────────────
function ping() {
  const url = process.env.RENDER_EXTERNAL_URL;
  if (!url) return;
  https.get(url).on('error', () => {});
}

ping(); // ping immediately on startup
setInterval(ping, 1 * 60 * 1000); // then every 1 minute

// ── Discord client ────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.GuildMember],
});

client.commands = new Collection();

// ── Load commands ─────────────────────────────
for (const file of fs.readdirSync('./commands').filter(f => f.endsWith('.js'))) {
  const cmd = require(path.join(__dirname, 'commands', file));
  if (cmd.data && cmd.execute) {
    client.commands.set(cmd.data.name, cmd);
    console.log(`  ✅ /${cmd.data.name}`);
  }
}

// ── Load events ───────────────────────────────
for (const file of fs.readdirSync('./events').filter(f => f.endsWith('.js'))) {
  const ev = require(path.join(__dirname, 'events', file));
  ev.once
    ? client.once(ev.name, (...a) => ev.execute(...a, client))
    : client.on(ev.name,   (...a) => ev.execute(...a, client));
  console.log(`  ✅ ${ev.name}`);
}

// ── Error handlers ────────────────────────────
client.on('error',           e  => console.error('❌  Client error:', e.message));
client.on('warn',            m  => console.warn('⚠️  Warn:', m));
client.on('shardDisconnect', e  => console.warn('🔴  Disconnected:', e.code));
client.on('shardReconnecting', () => console.log('🔄  Reconnecting...'));

// ── Start ─────────────────────────────────────
const TOKEN = process.env.BOT_TOKEN?.trim();
const MONGO  = process.env.MONGODB_URI?.trim();

if (!TOKEN) { console.error('❌  BOT_TOKEN missing'); process.exit(1); }
if (!MONGO)  { console.error('❌  MONGODB_URI missing'); process.exit(1); }

(async () => {
  try {
    await connect();
    await client.login(TOKEN);
  } catch (e) {
    console.error('❌  Startup error:', e.message);
    process.exit(1);
  }
})();
