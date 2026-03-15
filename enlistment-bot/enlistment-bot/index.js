// ════════════════════════════════════════════════
//   index.js — Bot Entry Point
// ════════════════════════════════════════════════
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const fs     = require('fs');
const path   = require('path');
const config = require('./config');

// ── Client setup ──────────────────────────────
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
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
    console.log(`  ✅ Command loaded: /${command.data.name}`);
  }
}

// ── Load events ───────────────────────────────
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));

for (const file of eventFiles) {
  const event = require(path.join(eventsPath, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
  console.log(`  ✅ Event loaded: ${event.name}`);
}

// ── Login ──────────────────────────────────────
if (!config.token) {
  console.error('❌  BOT_TOKEN is missing! Copy .env.example to .env and fill it in.');
  process.exit(1);
}

client.login(config.token).catch(err => {
  console.error('❌  Failed to log in:', err.message);
  process.exit(1);
});
