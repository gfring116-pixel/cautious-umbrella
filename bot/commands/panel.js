const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { panel } = require('../utils/embeds');
const { isStaff } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder().setName('panel').setDescription('Post the enlistment panel'),
  async execute(interaction) {
    try {
      console.log(`[panel] used by ${interaction.user.tag}, isStaff: ${isStaff(interaction.member)}`);
      if (!isStaff(interaction.member)) return interaction.reply({ content: '❌ No permission.', ephemeral: true });
      const btn = new ButtonBuilder().setCustomId('start_app').setLabel('Start Application').setEmoji('🎖️').setStyle(ButtonStyle.Primary);
      console.log('[panel] sending embed...');
      await interaction.channel.send({ embeds: [panel()], components: [new ActionRowBuilder().addComponents(btn)] });
      console.log('[panel] done!');
      await interaction.reply({ content: '✅ Panel posted!', ephemeral: true });
    } catch (e) {
      console.error('[panel] ERROR:', e.message);
      console.error(e);
      await interaction.reply({ content: '❌ Error: ' + e.message, ephemeral: true }).catch(() => {});
    }
  },
};
