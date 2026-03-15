// ════════════════════════════════════════════════
//   commands/whois.js — Full member profile card
// ════════════════════════════════════════════════
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const AM      = require('../utils/applicationManager');
const config  = require('../config');
const { isStaff, getMemberDivision, fullTime, relTime, capitalise } = require('../utils/helpers');
const { formatAge } = require('../utils/roblox');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('whois')
    .setDescription('View a full profile card for an enlisted member')
    .addUserOption(o => o.setName('user').setDescription('The member to look up').setRequired(true)),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: '❌ No permission.', ephemeral: true });
    }

    const target = interaction.options.getUser('user');
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (!member) {
      return interaction.reply({ content: '❌ Member not found in this server.', ephemeral: true });
    }

    const latestAccepted = AM.getByUserId(target.id).find(a => a.status === 'accepted');
    const allApps        = AM.getByUserId(target.id);
    const divisionKey    = getMemberDivision(member);
    const div            = divisionKey ? config.roles.divisions[divisionKey] : null;
    const flags          = target.flags?.toArray() || [];
    const ageDays        = Math.floor((Date.now() - target.createdTimestamp) / 86400000);

    const embed = new EmbedBuilder()
      .setColor(div ? parseInt(div.id.slice(-6), 16) % 0xFFFFFF || config.colors.accent : config.colors.info)
      .setTitle(`👤  ${member.nickname || target.tag}`)
      .setThumbnail(latestAccepted?.robloxData?.avatarUrl || target.displayAvatarURL())
      .addFields(
        // ── Discord ──
        { name: '💬  Discord', value: [
          `**Tag:** ${target.tag}`,
          `**ID:** \`${target.id}\``,
          `**Account Age:** ${ageDays} days`,
          `**Created:** ${fullTime(target.createdTimestamp)}`,
          `**Joined Server:** ${member.joinedAt ? fullTime(member.joinedTimestamp) : 'Unknown'}`,
          `**Badges:** ${flags.length > 0 ? flags.join(', ') : 'None'}`,
        ].join('\n'), inline: false },

        // ── Regiment ──
        { name: '⚔️  Regiment Status', value: [
          `**Division:** ${divisionKey ? capitalise(divisionKey) : '❌ Not Enlisted'}`,
          `**Prefix:** ${div ? `\`{${div.prefix}}\`` : '—'}`,
          `**Nickname:** ${member.nickname || '*Not set*'}`,
          `**Enlisted Role:** ${member.roles.cache.has(config.roles.enlisted) ? '✅ Yes' : '❌ No'}`,
        ].join('\n'), inline: false },

        // ── Roblox ──
        { name: '🎮  Roblox', value: latestAccepted?.robloxData ? [
          `**Username:** ${latestAccepted.robloxData.username}`,
          `**Display Name:** ${latestAccepted.robloxData.displayName}`,
          `**Account Age:** ${formatAge(latestAccepted.robloxData.created)}`,
        ].join('\n') : '*No verified Roblox account on file*', inline: false },

        // ── Application history ──
        { name: '📋  Application History', value: [
          `**Total Applications:** ${allApps.length}`,
          `**Accepted:** ${allApps.filter(a => a.status === 'accepted').length}`,
          `**Denied:** ${allApps.filter(a => a.status === 'denied').length}`,
          latestAccepted ? `**Enlisted Since:** ${relTime(latestAccepted.reviewedAt || latestAccepted.submittedAt)}` : '',
          latestAccepted ? `**App ID:** \`${latestAccepted.id}\`` : '',
        ].filter(Boolean).join('\n'), inline: false },
      )
      .setFooter({ text: `${config.serverName} Member Profile` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
