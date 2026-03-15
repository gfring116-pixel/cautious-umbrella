// ════════════════════════════════════════════════
//   commands/app-review.js — List pending apps
// ════════════════════════════════════════════════
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const AM        = require('../utils/applicationManager');
const config    = require('../config');
const { isStaff, relTime, capitalise } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('app-review')
    .setDescription('List all pending applications'),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: '❌ No permission.', ephemeral: true });
    }

    const pending = AM.getPending();

    if (!pending.length) {
      return interaction.reply({
        embeds: [{
          color: config.colors.success,
          title: '✅  No Pending Applications',
          description: 'There are no applications waiting for review.',
        }],
        ephemeral: true,
      });
    }

    const lines = pending.map((app, i) =>
      `**${i + 1}.** \`${app.id}\` — <@${app.userId}> — **${capitalise(app.answers.division)}** — Sus: ${app.susScore}/22 — ${relTime(app.submittedAt)}`
    );

    const embed = new EmbedBuilder()
      .setColor(config.colors.warn)
      .setTitle(`📋  Pending Applications (${pending.length})`)
      .setDescription(lines.join('\n'))
      .setFooter({ text: 'Use /forceaccept or /forcedeny to action without opening the review embed' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
