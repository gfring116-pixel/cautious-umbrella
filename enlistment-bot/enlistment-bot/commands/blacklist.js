// ════════════════════════════════════════════════
//   commands/blacklist.js
// ════════════════════════════════════════════════
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const AM     = require('../utils/applicationManager');
const config = require('../config');
const { isStaff, relTime } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blacklist')
    .setDescription('Manage the application blacklist')
    .addSubcommand(s => s
      .setName('add')
      .setDescription('Add a user to the blacklist')
      .addUserOption(o => o.setName('user').setDescription('User to blacklist').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(true))
    )
    .addSubcommand(s => s
      .setName('remove')
      .setDescription('Remove a user from the blacklist')
      .addUserOption(o => o.setName('user').setDescription('User to unblacklist').setRequired(true))
    )
    .addSubcommand(s => s
      .setName('list')
      .setDescription('View all blacklisted users')
    )
    .addSubcommand(s => s
      .setName('check')
      .setDescription('Check if a user is blacklisted')
      .addUserOption(o => o.setName('user').setDescription('User to check').setRequired(true))
    ),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: '❌ No permission.', ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();

    // ── Add ──────────────────────────────────
    if (sub === 'add') {
      const target = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason');
      AM.addBlacklist(target.id, reason, interaction.user.id);
      return interaction.reply({
        embeds: [{
          color: config.colors.danger,
          title: '🚫  User Blacklisted',
          description: `${target} has been blacklisted.\n**Reason:** ${reason}`,
        }],
        ephemeral: true,
      });
    }

    // ── Remove ────────────────────────────────
    if (sub === 'remove') {
      const target = interaction.options.getUser('user');
      if (!AM.isBlacklisted(target.id)) {
        return interaction.reply({ content: `⚠️ ${target} is not blacklisted.`, ephemeral: true });
      }
      AM.removeBlacklist(target.id);
      return interaction.reply({
        embeds: [{
          color: config.colors.success,
          title: '✅  Blacklist Removed',
          description: `${target} has been removed from the blacklist and may apply again.`,
        }],
        ephemeral: true,
      });
    }

    // ── List ──────────────────────────────────
    if (sub === 'list') {
      const list = AM.getBlacklist();
      if (!list.length) {
        return interaction.reply({ content: '✅ No users are blacklisted.', ephemeral: true });
      }
      const lines = list.map((b, i) =>
        `**${i + 1}.** <@${b.userId}> — ${b.reason} — ${relTime(b.addedAt)}`
      );
      return interaction.reply({
        embeds: [{
          color: config.colors.danger,
          title: `🚫  Blacklist (${list.length})`,
          description: lines.join('\n'),
        }],
        ephemeral: true,
      });
    }

    // ── Check ─────────────────────────────────
    if (sub === 'check') {
      const target = interaction.options.getUser('user');
      const entry  = AM.getBlacklistEntry(target.id);
      if (!entry) {
        return interaction.reply({ content: `✅ ${target} is **not** blacklisted.`, ephemeral: true });
      }
      return interaction.reply({
        embeds: [{
          color: config.colors.danger,
          title: '🚫  User is Blacklisted',
          description: [
            `**User:** ${target}`,
            `**Reason:** ${entry.reason}`,
            `**Added by:** <@${entry.addedBy}>`,
            `**Added:** ${relTime(entry.addedAt)}`,
          ].join('\n'),
        }],
        ephemeral: true,
      });
    }
  },
};
