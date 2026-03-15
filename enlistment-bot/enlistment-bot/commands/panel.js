// ════════════════════════════════════════════════
//   commands/panel.js — Post enlistment panel
// ════════════════════════════════════════════════
const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { panelEmbed } = require('../utils/embeds');
const { isStaff }    = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Post the enlistment panel in this channel'),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
    }

    const button = new ButtonBuilder()
      .setCustomId('start_application')
      .setLabel('Start Application')
      .setEmoji('🎖️')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(button);

    await interaction.channel.send({ embeds: [panelEmbed()], components: [row] });
    await interaction.reply({ content: '✅ Enlistment panel posted!', ephemeral: true });
  },
};
