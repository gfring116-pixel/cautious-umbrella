// ════════════════════════════════════════════════
//   commands/forceaccept.js
// ════════════════════════════════════════════════
const { SlashCommandBuilder } = require('discord.js');
const AM      = require('../utils/applicationManager');
const config  = require('../config');
const helpers = require('../utils/helpers');
const embeds  = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('forceaccept')
    .setDescription('Manually accept a user\'s pending application')
    .addUserOption(o => o.setName('user').setDescription('The applicant').setRequired(true))
    .addStringOption(o => o.setName('note').setDescription('Optional staff note')),

  async execute(interaction) {
    if (!helpers.isStaff(interaction.member)) {
      return interaction.reply({ content: '❌ No permission.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const target = interaction.options.getUser('user');
    const note   = interaction.options.getString('note') || null;
    const apps   = AM.getByUserId(target.id).filter(a => a.status === 'pending');

    if (!apps.length) {
      return interaction.editReply({ content: `⚠️ ${target} has no pending applications.` });
    }

    const app    = apps[0];
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    AM.updateStatus(app.id, { status: 'accepted', reviewedBy: interaction.user.id, reviewNote: note });

    if (member) {
      const enlistResult = await helpers.enlistMember(member, app.answers.division, app.robloxData?.username || app.answers.roblox_username);
      const nickname = helpers.buildNickname(app.answers.division, app.robloxData?.username || app.answers.roblox_username);
      await target.send({ embeds: [embeds.acceptanceDM(app, nickname)] }).catch(() => {});
      if (enlistResult.errors.length) console.warn('[ForceAccept]', enlistResult.errors);
    }

    // Audit log
    const auditChannel = interaction.guild.channels.cache.get(config.channels.auditLog);
    if (auditChannel) {
      await auditChannel.send({ embeds: [embeds.auditEmbed(app, interaction.user.id, 'accepted', note)] }).catch(() => {});
    }

    await interaction.editReply({ content: `✅ **${target.tag}** has been force-accepted and roles assigned.` });
  },
};
