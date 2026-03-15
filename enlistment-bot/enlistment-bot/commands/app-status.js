// ════════════════════════════════════════════════
//   commands/app-status.js
// ════════════════════════════════════════════════
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const AM     = require('../utils/applicationManager');
const config = require('../config');
const { isStaff, relTime, capitalise } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('app-status')
    .setDescription('Check your own application status, or another user\'s (staff only)')
    .addUserOption(o => o.setName('user').setDescription('(Staff) Check another user\'s application')),

  async execute(interaction) {
    // Staff can look up anyone; regular users can only see their own
    const targetUser = interaction.options.getUser('user');
    if (targetUser && !isStaff(interaction.member)) {
      return interaction.reply({ content: '❌ Only staff can look up other users.', ephemeral: true });
    }

    const lookupUser = targetUser || interaction.user;
    const latest     = AM.getLatest(lookupUser.id);

    if (!latest) {
      return interaction.reply({
        embeds: [{
          color: config.colors.info,
          title: '📋  No Application Found',
          description: `${lookupUser} has not submitted an application yet.`,
        }],
        ephemeral: true,
      });
    }

    const statusColor = {
      accepted:   config.colors.success,
      denied:     config.colors.danger,
      pending:    config.colors.warn,
      waitlisted: config.colors.warn,
      interview:  config.colors.interview,
    }[latest.status] || config.colors.accent;

    const statusLabel = {
      accepted:   '✅  ACCEPTED',
      denied:     '❌  DENIED',
      pending:    '⏳  UNDER REVIEW',
      waitlisted: '🔁  WAITLISTED',
      interview:  '📋  INTERVIEW REQUESTED',
    }[latest.status] || latest.status.toUpperCase();

    const embed = new EmbedBuilder()
      .setColor(statusColor)
      .setTitle(`📋  Application Status — ${statusLabel}`)
      .setThumbnail(latest.robloxData?.avatarUrl || lookupUser.displayAvatarURL())
      .addFields(
        { name: 'Application ID',  value: `\`${latest.id}\``,                                 inline: true },
        { name: 'Status',          value: statusLabel,                                         inline: true },
        { name: 'Submitted',       value: relTime(latest.submittedAt),                        inline: true },
        { name: 'Roblox Username', value: latest.robloxData?.username || latest.answers.roblox_username, inline: true },
        { name: 'Division',        value: capitalise(latest.answers.division),                inline: true },
        { name: 'Activity',        value: `${latest.answers.activity} / 10`,                  inline: true },
        { name: 'Timezone',        value: latest.answers.timezone,                            inline: true },
        ...(latest.reviewedAt ? [
          { name: 'Reviewed',      value: relTime(latest.reviewedAt), inline: true },
        ] : []),
        ...(latest.reviewNote ? [
          { name: 'Staff Note',    value: latest.reviewNote, inline: false },
        ] : []),
      )
      .setFooter({ text: `${config.serverName} Enlistment` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
