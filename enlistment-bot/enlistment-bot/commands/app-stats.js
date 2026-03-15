// ════════════════════════════════════════════════
//   commands/app-stats.js — Application statistics
// ════════════════════════════════════════════════
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const AM     = require('../utils/applicationManager');
const config = require('../config');
const { isStaff } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('app-stats')
    .setDescription('View application statistics'),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: '❌ No permission.', ephemeral: true });
    }

    const stats = AM.getStats();
    const all   = AM.getAll();

    // Per-division breakdown
    const divCounts = {};
    for (const key of Object.keys(config.roles.divisions)) divCounts[key] = 0;
    for (const app of all) {
      if (app.status === 'accepted' && divCounts[app.answers.division] !== undefined) {
        divCounts[app.answers.division]++;
      }
    }

    const acceptRate = stats.total > 0
      ? `${Math.round((stats.accepted / stats.total) * 100)}%`
      : 'N/A';

    const divLines = Object.entries(divCounts)
      .map(([key, count]) => `> **${key.charAt(0).toUpperCase() + key.slice(1)}:** ${count} enlisted`)
      .join('\n');

    const embed = new EmbedBuilder()
      .setColor(config.colors.accent)
      .setTitle(`📊  ${config.serverName} — Application Statistics`)
      .addFields(
        { name: '📥  Total Applications', value: `${stats.total}`,     inline: true },
        { name: '✅  Accepted',           value: `${stats.accepted}`,  inline: true },
        { name: '❌  Denied',             value: `${stats.denied}`,    inline: true },
        { name: '⏳  Pending',            value: `${stats.pending}`,   inline: true },
        { name: '🔁  Waitlisted',         value: `${stats.waitlisted || 0}`, inline: true },
        { name: '📋  Interview',          value: `${stats.interview || 0}`,  inline: true },
        { name: '📈  Accept Rate',        value: acceptRate,            inline: true },
        { name: '⚔️  Enlisted by Division', value: divLines || 'None', inline: false },
      )
      .setFooter({ text: `${config.serverName} Statistics` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
