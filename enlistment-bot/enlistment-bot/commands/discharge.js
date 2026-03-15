// ════════════════════════════════════════════════
//   commands/discharge.js
// ════════════════════════════════════════════════
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config  = require('../config');
const helpers = require('../utils/helpers');
const embeds  = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('discharge')
    .setDescription('Discharge a member — strips all regiment roles and resets nickname')
    .addUserOption(o => o.setName('user').setDescription('Member to discharge').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason for discharge').setRequired(true)),

  async execute(interaction) {
    if (!helpers.isStaff(interaction.member)) {
      return interaction.reply({ content: '❌ No permission.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (!member) {
      return interaction.editReply({ content: '❌ Member not found in this server.' });
    }

    const divisionKey = helpers.getMemberDivision(member);
    if (!divisionKey && !member.roles.cache.has(config.roles.enlisted)) {
      return interaction.editReply({ content: `⚠️ ${target} does not appear to be enlisted.` });
    }

    const errors = await helpers.dischargeMember(member);

    // DM the discharged member
    await target.send({
      embeds: [new EmbedBuilder()
        .setColor(config.colors.danger)
        .setTitle(`🔴  Discharged from ${config.serverName}`)
        .setDescription(
          `You have been **discharged** from **${config.serverName}**.\n\n` +
          `**Reason:** ${reason}\n\n` +
          `All regiment roles and your nickname have been removed. Contact a staff member if you believe this is an error.`
        )
        .setFooter({ text: config.serverName })
        .setTimestamp()],
    }).catch(() => {});

    // Audit log
    const auditChannel = interaction.guild.channels.cache.get(config.channels.auditLog);
    if (auditChannel) {
      await auditChannel.send({
        embeds: [new EmbedBuilder()
          .setColor(config.colors.danger)
          .setTitle('🔴  Audit Log — DISCHARGED')
          .addFields(
            { name: 'Member',       value: `${target} (\`${target.id}\`)`, inline: true },
            { name: 'Discharged By', value: `${interaction.user}`,          inline: true },
            { name: 'Division Was', value: divisionKey ? helpers.capitalise(divisionKey) : 'Unknown', inline: true },
            { name: 'Reason',       value: reason, inline: false },
          )
          .setFooter({ text: `${config.serverName} Audit Log` })
          .setTimestamp()],
      }).catch(() => {});
    }

    if (errors.length) console.warn('[Discharge] Errors:', errors);

    await interaction.editReply({
      content: `✅ **${target.tag}** has been discharged. Roles removed and nickname reset.\n${errors.length ? `⚠️ Some errors: ${errors.join(', ')}` : ''}`,
    });
  },
};
