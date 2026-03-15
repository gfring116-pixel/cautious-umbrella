const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { panel } = require('../utils/embeds');

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot) return;
    if (message.content === '!panel') {
      try {
        const btn = new ButtonBuilder().setCustomId('start_app').setLabel('Start Application').setEmoji('🎖️').setStyle(ButtonStyle.Primary);
        await message.channel.send({ embeds: [panel()], components: [new ActionRowBuilder().addComponents(btn)] });
        await message.delete().catch(() => {});
      } catch (e) {
        console.error('[!panel]', e.message);
        await message.reply('❌ Error: ' + e.message);
      }
    }
  },
};
