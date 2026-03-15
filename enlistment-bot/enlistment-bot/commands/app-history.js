// ════════════════════════════════════════════════
//   commands/app-history.js
// ════════════════════════════════════════════════
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const AM     = require('../utils/applicationManager');
const config = require('../config');
const { isStaff, relTime, capitalise } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('app-history')
    .setDescription('View full application history of a user')
    .addUserOption(o => o.setName('user').setDescription('The user to look up').setRequired(true)),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: '❌ No permission.', ephemeral: true });
    }

    const target = interaction.options.getUser('user');
    const apps   = AM.getByUserId(target.id);

    if (!apps.length) {
      return interaction.reply({
        embeds: [{
          color: config.colors.info,
          title: `📋  No Applications`,
          description: `${target} has never applied to ${config.serverName}.`,
        }],
        ephemeral: true,
      });
    }

    const statusEmoji = { accepted: '✅', denied: '❌', pending: '⏳', waitlisted: '🔁', interview: '📋' };

    const fields = apps.map(app => ({
      name: `${statusEmoji[app.status] || '❓'} ${app.id} — ${capitalise(app.answers.division)}`,
      value: [
        `**Status:** ${app.status.toUpperCase()}`,
        `**Roblox:** ${app.robloxData?.username || app.answers.roblox_username}`,
        `**Activity:** ${app.answers.activity}/10`,
        `**Sus Score:** ${app.susScore}/22`,
        `**Submitted:** ${relTime(app.submittedAt)}`,
        app.reviewedAt ? `**Reviewed:** ${relTime(app.reviewedAt)}` : '',
        app.reviewNote ? `**Note:** ${app.reviewNote}` : '',
      ].filter(Boolean).join('\n'),
      inline: false,
    }));

    const embed = new EmbedBuilder()
      .setColor(config.colors.accent)
      .setTitle(`📋  Application History — ${target.tag}`)
      .setThumbnail(target.displayAvatarURL())
      .addFields(fields.slice(0, 10)) // Discord limit: 25 fields, show last 10
      .setFooter({ text: `${apps.length} total application(s) • ${config.serverName}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
