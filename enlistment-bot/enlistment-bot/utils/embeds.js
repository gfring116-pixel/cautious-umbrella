// ════════════════════════════════════════════════
//   utils/embeds.js — All embed factories
// ════════════════════════════════════════════════
const { EmbedBuilder } = require('discord.js');
const config  = require('../config');
const { relTime, fullTime, capitalise } = require('./helpers');
const { formatBreakdown } = require('./susDetector');
const { formatAge } = require('./roblox');

// ── Enlistment Panel ──────────────────────────
function panelEmbed() {
  return new EmbedBuilder()
    .setColor(config.colors.accent)
    .setTitle(`${config.serverEmoji}  ${config.serverName} — Enlistment Portal`)
    .setDescription(
      `> *"Those who serve with honour earn their place in history."*\n\n` +
      `Welcome, aspiring Rekrut! This is the official enlistment portal for **${config.serverName}**.\n` +
      `Click **Start Application** below to begin your journey.`
    )
    .addFields(
      {
        name: '📋  Requirements',
        value: [
          '> ✅  Valid **Roblox** account',
          '> ✅  Active **Discord** account',
          '> ✅  Commitment to **training & events**',
          '> ✅  Respect for **chain of command**',
        ].join('\n'),
      },
      {
        name: '⚔️  Available Divisions',
        value: [
          '🗡️  **Infantry** — Front-line ground troops',
          '🐴  **Militia** — Irregular light forces',
          '🛡️  **Guard** — Elite defensive regiment',
          '⚓  **Navy** — Maritime & amphibious operations',
        ].join('\n'),
      },
      {
        name: '🔄  Application Process',
        value: [
          '**1.** Click **Start Application** and fill in the form',
          '**2.** Your answers & account are reviewed instantly',
          '**3.** You\'ll receive a DM with the decision',
          '**4.** If accepted — roles & nickname assigned automatically',
          '**5.** Head to the training channel to earn your full rank',
        ].join('\n'),
      }
    )
    .setFooter({ text: `${config.serverName} Enlistment System` })
    .setTimestamp();
}

// ── Receipt (ephemeral, shown to applicant) ───
function receiptEmbed(app) {
  return new EmbedBuilder()
    .setColor(config.colors.warn)
    .setTitle('📨  Application Submitted!')
    .setDescription(`Your application has been received. You'll be DM'd with the result shortly.`)
    .addFields(
      { name: 'Application ID',  value: `\`${app.id}\``,                           inline: true },
      { name: 'Status',          value: '⏳  Under Review',                          inline: true },
      { name: 'Submitted',       value: relTime(app.submittedAt),                   inline: true },
      { name: 'Roblox Username', value: app.robloxData?.username || app.answers.roblox_username, inline: true },
      { name: 'Division',        value: capitalise(app.answers.division),            inline: true },
      { name: 'Activity',        value: `${app.answers.activity} / 10`,              inline: true },
      { name: 'Timezone',        value: app.answers.timezone,                        inline: true },
    )
    .setThumbnail(app.robloxData?.avatarUrl || null)
    .setFooter({ text: 'Keep this ID for reference' });
}

// ── Staff Review Embed ────────────────────────
function staffReviewEmbed(app, member) {
  const user    = member.user;
  const sus     = app.susScore;
  const breakdown = formatBreakdown(app.susBreakdown, sus, 22);
  const ageDays = Math.floor((Date.now() - user.createdTimestamp) / 86400000);
  const flags   = user.flags?.toArray() || [];

  let susColor, susLabel;
  if (sus <= config.sus.autoApproveMax) { susColor = config.colors.success; susLabel = '✅ CLEAN'; }
  else if (sus <= config.sus.flaggedMax) { susColor = config.colors.warn;  susLabel = '⚠️ FLAGGED'; }
  else                                   { susColor = config.colors.danger; susLabel = '🚨 HIGH RISK'; }

  return new EmbedBuilder()
    .setColor(susColor)
    .setTitle(`📋  New Application — ${susLabel}`)
    .setDescription(`Application from ${user} requires staff review.`)
    .setThumbnail(app.robloxData?.avatarUrl || user.displayAvatarURL())
    .addFields(
      // ── Application Answers ──
      { name: '━━━  Application Answers  ━━━', value: '\u200b' },
      { name: 'Roblox Username', value: app.robloxData?.username || app.answers.roblox_username, inline: true },
      { name: 'Division',        value: capitalise(app.answers.division),   inline: true },
      { name: 'Activity',        value: `${app.answers.activity} / 10`,     inline: true },
      { name: 'Timezone',        value: app.answers.timezone,               inline: true },

      // ── Roblox Info ──
      { name: '━━━  Roblox Profile  ━━━', value: '\u200b' },
      {
        name: 'Roblox Account',
        value: app.robloxData
          ? [
              `**Username:** ${app.robloxData.username}`,
              `**Display Name:** ${app.robloxData.displayName}`,
              `**Account Age:** ${formatAge(app.robloxData.created)}`,
              `**Created:** ${new Date(app.robloxData.created).toDateString()}`,
            ].join('\n')
          : '⚠️ Could not verify Roblox account',
        inline: false,
      },

      // ── Discord Info ──
      { name: '━━━  Discord Profile  ━━━', value: '\u200b' },
      {
        name: 'Discord Account',
        value: [
          `**Tag:** ${user.tag}`,
          `**ID:** \`${user.id}\``,
          `**Account Age:** ${ageDays} days`,
          `**Created:** ${fullTime(user.createdTimestamp)}`,
          `**Joined Server:** ${member.joinedAt ? fullTime(member.joinedTimestamp) : 'Unknown'}`,
          `**Badges:** ${flags.length > 0 ? flags.join(', ') : 'None'}`,
          `**Avatar:** ${user.avatar ? 'Custom' : 'Default (no avatar)'}`,
        ].join('\n'),
        inline: false,
      },

      // ── Sus Score ──
      { name: '━━━  Suspicion Analysis  ━━━', value: '\u200b' },
      {
        name: `Sus Score: ${sus} / 22 — ${susLabel}`,
        value: breakdown,
        inline: false,
      },

      // ── Meta ──
      { name: 'Application ID', value: `\`${app.id}\``, inline: true },
      { name: 'Submitted',      value: relTime(app.submittedAt), inline: true },
    )
    .setFooter({ text: `User ID: ${user.id}` })
    .setTimestamp();
}

// ── Log Embed (posted in application logs) ────
function logEmbed(app, member) {
  return new EmbedBuilder()
    .setColor(config.colors.info)
    .setTitle(`📝  Application Received — ${app.id}`)
    .setThumbnail(app.robloxData?.avatarUrl || member.user.displayAvatarURL())
    .addFields(
      { name: 'Discord User',    value: `${member.user} (\`${member.user.id}\`)`, inline: true },
      { name: 'Roblox Username', value: app.robloxData?.username || app.answers.roblox_username, inline: true },
      { name: 'Division',        value: capitalise(app.answers.division), inline: true },
      { name: 'Activity',        value: `${app.answers.activity}/10`,     inline: true },
      { name: 'Sus Score',       value: `${app.susScore}/22`,              inline: true },
      { name: 'Submitted',       value: relTime(app.submittedAt),          inline: true },
    )
    .setFooter({ text: `${config.serverName} Application Log` })
    .setTimestamp();
}

// ── Audit Log (who accepted/denied) ──────────
function auditEmbed(app, actionBy, action, note) {
  const color = {
    accepted:   config.colors.success,
    denied:     config.colors.danger,
    waitlisted: config.colors.warn,
    interview:  config.colors.interview,
  }[action] || config.colors.accent;

  const actionLabel = {
    accepted:   '✅  ACCEPTED',
    denied:     '❌  DENIED',
    waitlisted: '🔁  WAITLISTED',
    interview:  '📋  INTERVIEW REQUESTED',
  }[action] || action.toUpperCase();

  return new EmbedBuilder()
    .setColor(color)
    .setTitle(`🔏  Audit Log — ${actionLabel}`)
    .addFields(
      { name: 'Application ID',  value: `\`${app.id}\``,                    inline: true },
      { name: 'Applicant',       value: `<@${app.userId}>`,                  inline: true },
      { name: 'Action By',       value: `<@${actionBy}>`,                    inline: true },
      { name: 'Roblox Username', value: app.robloxData?.username || '—',      inline: true },
      { name: 'Division',        value: capitalise(app.answers.division),     inline: true },
      { name: 'Decided',         value: relTime(new Date().toISOString()),    inline: true },
      { name: 'Staff Note',      value: note || '*No note provided*',         inline: false },
    )
    .setFooter({ text: `${config.serverName} Audit Log` })
    .setTimestamp();
}

// ── Acceptance DM ─────────────────────────────
function acceptanceDM(app, nickname) {
  return new EmbedBuilder()
    .setColor(config.colors.success)
    .setTitle(`🎖️  Welcome to ${config.serverName}!`)
    .setDescription(
      `Congratulations, **${nickname}**!\n\n` +
      `Your enlistment application has been **accepted**. You are now a member of the **${capitalise(app.answers.division)}** division.\n\n` +
      `Head to <#${config.channels.training}> and request training to be promoted to **Soldat**!`
    )
    .setThumbnail(app.robloxData?.avatarUrl || null)
    .addFields(
      { name: '🪪  Your Nickname',  value: nickname,                          inline: true },
      { name: '⚔️  Division',       value: capitalise(app.answers.division), inline: true },
      { name: '📋  Application ID', value: `\`${app.id}\``,                   inline: true },
    )
    .setFooter({ text: `${config.serverName} — Serve with honour` })
    .setTimestamp();
}

// ── Denial DM ─────────────────────────────────
function denialDM(app, reason) {
  return new EmbedBuilder()
    .setColor(config.colors.danger)
    .setTitle('❌  Application Denied')
    .setDescription(
      `Your enlistment application for **${config.serverName}** has been **denied**.\n\n` +
      (reason ? `**Reason:** ${reason}\n\n` : '') +
      `You may re-apply at any time. If you believe this is a mistake, please contact a staff member.`
    )
    .addFields(
      { name: 'Application ID', value: `\`${app.id}\``, inline: true },
    )
    .setFooter({ text: `${config.serverName} Enlistment` })
    .setTimestamp();
}

// ── Interview DM ──────────────────────────────
function interviewDM(app) {
  return new EmbedBuilder()
    .setColor(config.colors.interview)
    .setTitle('📋  Interview Requested')
    .setDescription(
      `Your application for **${config.serverName}** has been flagged for an **interview** before a final decision is made.\n\n` +
      `A staff member will reach out to you shortly to schedule a quick interview. Please be patient and remain reachable.`
    )
    .addFields(
      { name: 'Application ID', value: `\`${app.id}\``, inline: true },
    )
    .setFooter({ text: `${config.serverName} Enlistment` })
    .setTimestamp();
}

// ── Waitlist DM ───────────────────────────────
function waitlistDM(app, note) {
  return new EmbedBuilder()
    .setColor(config.colors.warn)
    .setTitle('🔁  Application Waitlisted')
    .setDescription(
      `Your application for **${config.serverName}** has been placed on the **waitlist**.\n\n` +
      (note ? `**Staff Note:** ${note}\n\n` : '') +
      `This means a final decision has been delayed. You will be notified when your status changes.`
    )
    .addFields(
      { name: 'Application ID', value: `\`${app.id}\``, inline: true },
    )
    .setFooter({ text: `${config.serverName} Enlistment` })
    .setTimestamp();
}

module.exports = {
  panelEmbed, receiptEmbed, staffReviewEmbed,
  logEmbed, auditEmbed,
  acceptanceDM, denialDM, interviewDM, waitlistDM,
};
