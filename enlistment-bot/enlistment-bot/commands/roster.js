// ════════════════════════════════════════════════
//   commands/roster.js — Live enlisted roster
// ════════════════════════════════════════════════
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config  = require('../config');
const { isStaff } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roster')
    .setDescription('View all currently enlisted members by division'),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: '❌ No permission.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: false });

    const guild = interaction.guild;
    await guild.members.fetch(); // Cache all members

    const divEmoji = { infantry: '🗡️', militia: '🐴', guard: '🛡️', navy: '⚓' };
    const fields   = [];
    let totalEnlisted = 0;

    for (const [key, div] of Object.entries(config.roles.divisions)) {
      const role    = guild.roles.cache.get(div.id);
      if (!role) continue;
      const members = role.members;
      totalEnlisted += members.size;

      if (members.size === 0) {
        fields.push({ name: `${divEmoji[key] || '⚔️'}  ${key.charAt(0).toUpperCase() + key.slice(1)} — 0 members`, value: '*No members enrolled*', inline: false });
      } else {
        const list = members.map(m => `> ${m} ${m.nickname ? `(${m.nickname})` : ''}`).join('\n');
        fields.push({
          name: `${divEmoji[key] || '⚔️'}  ${key.charAt(0).toUpperCase() + key.slice(1)} — ${members.size} member${members.size !== 1 ? 's' : ''}`,
          value: list.length > 1000 ? list.substring(0, 997) + '...' : list,
          inline: false,
        });
      }
    }

    const embed = new EmbedBuilder()
      .setColor(config.colors.accent)
      .setTitle(`${config.serverEmoji}  ${config.serverName} — Active Roster`)
      .setDescription(`**Total Enlisted: ${totalEnlisted}**`)
      .addFields(fields)
      .setFooter({ text: `${config.serverName} Roster` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
