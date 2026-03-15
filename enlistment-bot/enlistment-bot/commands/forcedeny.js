// ════════════════════════════════════════════════
//   commands/forcedeny.js
// ════════════════════════════════════════════════
const { SlashCommandBuilder } = require('discord.js');
const AM      = require('../utils/applicationManager');
const config  = require('../config');
const helpers = require('../utils/helpers');
const embeds  = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('forcedeny')
    .setDescription('Manually deny a user\'s pending application')
    .addUserOption(o => o.setName('user').setDescription('The applicant').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Denial reason').setRequired(true)),

  async execute(interaction) {
    if (!helpers.isStaff(interaction.member)) {
      return interaction.reply({ content: '❌ No permission.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');
    const apps   = AM.getByUserId(target.id).filter(a => a.status === 'pending');

    if (!apps.length) {
      return interaction.editReply({ content: `⚠️ ${target} has no pending applications.` });
    }

    const app = apps[0];
    AM.updateStatus(app.id, { status: 'denied', reviewedBy: interaction.user.id, reviewNote: reason });

    await target.send({ embeds: [embeds.denialDM(app, reason)] }).catch(() => {});

    // Auto-blacklist check
    const denials = AM.getDenialCount(target.id);
    if (denials >= config.autoBlacklistAfter) {
      AM.addBlacklist(target.id, `Auto-blacklisted after ${denials} denials`, interaction.user.id);
      await interaction.followUp({ content: `⚠️ ${target} was **auto-blacklisted** after ${denials} denials.`, ephemeral: true }).catch(() => {});
    }

    // Audit log
    const auditChannel = interaction.guild.channels.cache.get(config.channels.auditLog);
    if (auditChannel) {
      await auditChannel.send({ embeds: [embeds.auditEmbed(app, interaction.user.id, 'denied', reason)] }).catch(() => {});
    }

    await interaction.editReply({ content: `❌ **${target.tag}** has been force-denied. Reason: ${reason}` });
  },
};
