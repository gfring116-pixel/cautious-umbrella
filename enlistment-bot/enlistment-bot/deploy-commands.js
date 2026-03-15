// ════════════════════════════════════════════════
//   deploy-commands.js
//   Run ONCE with: node deploy-commands.js
//   Re-run whenever you add/change a command
// ════════════════════════════════════════════════
const { REST, Routes } = require('discord.js');
const fs     = require('fs');
const path   = require('path');
const config = require('./config');

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const cmd = require(path.join(__dirname, 'commands', file));
  if (cmd.data) {
    commands.push(cmd.data.toJSON());
    console.log(`  📦 Queued: /${cmd.data.name}`);
  }
}

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
  try {
    console.log(`\n🔄  Deploying ${commands.length} command(s) to guild ${config.guildId}...\n`);
    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commands }
    );
    console.log(`\n✅  All commands deployed successfully!`);
    console.log(`    Commands are now available in your Discord server.\n`);
  } catch (err) {
    console.error('❌  Deployment failed:', err.message);
  }
})();
