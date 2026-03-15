// ════════════════════════════════════════════════
//   events/interactionCreate.js
//   Central handler for all interactions
// ════════════════════════════════════════════════
const {
  ModalBuilder, TextInputBuilder, TextInputStyle,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
} = require('discord.js');

const config  = require('../config');
const AM      = require('../utils/applicationManager');
const sus     = require('../utils/susDetector');
const roblox  = require('../utils/roblox');
const helpers = require('../utils/helpers');
const embeds  = require('../utils/embeds');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    try {
      // ── Slash Commands ──────────────────────
      if (interaction.isChatInputCommand()) {
        const cmd = client.commands.get(interaction.commandName);
        if (!cmd) return;
        await cmd.execute(interaction, client);
        return;
      }

      // ── Button: Start Application ───────────
      if (interaction.isButton() && interaction.customId === 'start_application') {
        await handleStartApplication(interaction);
        return;
      }

      // ── Modal: Application Form ──────────────
      if (interaction.isModalSubmit() && interaction.customId === 'application_modal') {
        await handleApplicationSubmit(interaction, client);
        return;
      }

      // ── Modal: Staff Note (accept/deny/etc.) ─
      if (interaction.isModalSubmit() && interaction.customId.startsWith('staff_note_')) {
        await handleStaffNote(interaction, client);
        return;
      }

      // ── Buttons: Accept / Deny / Interview / Waitlist ──
      if (interaction.isButton() && interaction.customId.startsWith('app_')) {
        await handleStaffButton(interaction, client);
        return;
      }

    } catch (err) {
      console.error('[interactionCreate]', err);
      const msg = { content: '❌ An error occurred. Please try again.', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(msg).catch(() => {});
      } else {
        await interaction.reply(msg).catch(() => {});
      }
    }
  },
};

// ════════════════════════════════════════════════
//   Start Application button
// ════════════════════════════════════════════════
async function handleStartApplication(interaction) {
  const userId = interaction.user.id;
  const member = interaction.member;

  // ── Blacklist check ──────────────────────────
  if (AM.isBlacklisted(userId)) {
    const entry = AM.getBlacklistEntry(userId);
    return interaction.reply({
      embeds: [{
        color: config.colors.danger,
        title: '🚫  You are Blacklisted',
        description: `You are blacklisted from applying to **${config.serverName}**.\n\n**Reason:** ${entry?.reason || 'No reason given'}`,
        footer: { text: 'Contact a staff member to appeal' },
      }],
      ephemeral: true,
    });
  }

  // ── Already enlisted check ───────────────────
  const alreadyEnlisted = Object.values(config.roles.divisions)
    .some(d => member.roles.cache.has(d.id));
  if (alreadyEnlisted || member.roles.cache.has(config.roles.enlisted)) {
    return interaction.reply({
      embeds: [{
        color: config.colors.warn,
        title: '⚠️  Already Enlisted',
        description: 'You are already a member of this regiment. Contact staff if you wish to change divisions.',
      }],
      ephemeral: true,
    });
  }

  // ── Show modal ───────────────────────────────
  const modal = new ModalBuilder()
    .setCustomId('application_modal')
    .setTitle(`${config.serverName} — Enlistment Form`);

  const robloxInput = new TextInputBuilder()
    .setCustomId('roblox_username')
    .setLabel('Roblox Username')
    .setPlaceholder('Enter your exact Roblox username')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(20);

  const timezoneInput = new TextInputBuilder()
    .setCustomId('timezone')
    .setLabel('Your Timezone')
    .setPlaceholder('e.g. EST, UTC+8, GMT+1')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(20);

  const divisionInput = new TextInputBuilder()
    .setCustomId('division')
    .setLabel('Preferred Division')
    .setPlaceholder('Infantry / Militia / Guard / Navy')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(20);

  const activityInput = new TextInputBuilder()
    .setCustomId('activity')
    .setLabel('Activity Level (1–10)')
    .setPlaceholder('How active are you? Enter a number 1–10.')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(2);

  modal.addComponents(
    new ActionRowBuilder().addComponents(robloxInput),
    new ActionRowBuilder().addComponents(timezoneInput),
    new ActionRowBuilder().addComponents(divisionInput),
    new ActionRowBuilder().addComponents(activityInput),
  );

  await interaction.showModal(modal);
}

// ════════════════════════════════════════════════
//   Application modal submitted
// ════════════════════════════════════════════════
async function handleApplicationSubmit(interaction, client) {
  await interaction.deferReply({ ephemeral: true });

  const userId = interaction.user.id;
  const member = interaction.member;

  const raw = {
    roblox_username: interaction.fields.getTextInputValue('roblox_username').trim(),
    timezone:        interaction.fields.getTextInputValue('timezone').trim(),
    division:        interaction.fields.getTextInputValue('division').trim().toLowerCase(),
    activity:        interaction.fields.getTextInputValue('activity').trim(),
  };

  // ── Validate Division ────────────────────────
  const divisionKey = helpers.parseDivision(raw.division);
  if (!divisionKey) {
    return interaction.editReply({
      embeds: [{
        color: config.colors.danger,
        title: '❌  Invalid Division',
        description: `Please choose one of: **Infantry**, **Militia**, **Guard**, **Navy**.\n\nClick the button again to resubmit.`,
      }],
    });
  }

  // ── Validate Activity ────────────────────────
  const activity = helpers.parseActivity(raw.activity);
  if (!activity) {
    return interaction.editReply({
      embeds: [{
        color: config.colors.danger,
        title: '❌  Invalid Activity Score',
        description: `Activity must be a number between **1** and **10**.\n\nClick the button again to resubmit.`,
      }],
    });
  }

  // ── Validate Roblox Username ──────────────────
  await interaction.editReply({
    embeds: [{
      color: config.colors.info,
      description: '🔍  Verifying your Roblox account...',
    }],
  });

  const robloxData = await roblox.getRobloxUser(raw.roblox_username);
  if (!robloxData) {
    return interaction.editReply({
      embeds: [{
        color: config.colors.danger,
        title: '❌  Roblox Username Not Found',
        description: `We couldn't find a Roblox account named **${raw.roblox_username}**.\n\nPlease check your spelling and click the button again to resubmit.`,
      }],
    });
  }

  // ── Sus Detection ─────────────────────────────
  const susResult = sus.analyse(member);

  // ── Build answers ────────────────────────────
  const answers = {
    roblox_username: raw.roblox_username,
    timezone:        raw.timezone,
    division:        divisionKey,
    activity:        activity.toString(),
  };

  // ── Determine status ──────────────────────────
  const autoApprove = susResult.level === 'clean';
  const status = autoApprove ? 'accepted' : 'pending';

  // ── Save application ──────────────────────────
  const app = AM.createApplication({
    userId,
    guildId: interaction.guildId,
    answers,
    susScore:     susResult.score,
    susBreakdown: susResult.breakdown,
    robloxData,
    status,
  });

  // ── Show receipt to user ──────────────────────
  await interaction.editReply({ embeds: [embeds.receiptEmbed(app)] });

  // ── Log to application-logs ───────────────────
  const logsChannel = interaction.guild.channels.cache.get(config.channels.applicationLogs);
  let logMsg = null;
  if (logsChannel) {
    logMsg = await logsChannel.send({ embeds: [embeds.logEmbed(app, member)] }).catch(() => null);
    if (logMsg) await logMsg.react(config.reactions.submitted).catch(() => {});
  }

  // ── Auto-approve path ─────────────────────────
  if (autoApprove) {
    const enlistResult = await helpers.enlistMember(member, divisionKey, robloxData.username);
    const nickname = helpers.buildNickname(divisionKey, robloxData.username);

    AM.updateStatus(app.id, { status: 'accepted', reviewedBy: client.user.id, reviewNote: 'Auto-approved (clean account)' });

    // DM applicant
    await interaction.user.send({ embeds: [embeds.acceptanceDM(app, nickname)] }).catch(() => {});

    // React to log message
    if (logMsg) await logMsg.react(config.reactions.accepted).catch(() => {});

    // Audit log
    const auditChannel = interaction.guild.channels.cache.get(config.channels.auditLog);
    if (auditChannel) {
      await auditChannel.send({ embeds: [embeds.auditEmbed(app, client.user.id, 'accepted', 'Auto-approved — clean account score')] }).catch(() => {});
    }

    if (enlistResult.errors.length) {
      console.warn('[AutoAccept] Errors:', enlistResult.errors);
    }
    return;
  }

  // ── Staff review path ─────────────────────────
  const reviewChannel = interaction.guild.channels.cache.get(config.channels.staffReview);
  if (reviewChannel) {
    const staffRole = interaction.guild.roles.cache.get(config.roles.staffRole);
    const pingText  = staffRole ? `${staffRole} — New application requires review!` : '📋 New application requires review!';

    const reviewButtons = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`app_accept_${app.id}`).setLabel('Accept').setEmoji('✅').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`app_deny_${app.id}`).setLabel('Deny').setEmoji('❌').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`app_interview_${app.id}`).setLabel('Request Interview').setEmoji('📋').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`app_waitlist_${app.id}`).setLabel('Waitlist').setEmoji('🔁').setStyle(ButtonStyle.Secondary),
    );

    const reviewMsg = await reviewChannel.send({
      content: pingText,
      embeds:  [embeds.staffReviewEmbed(app, member)],
      components: [reviewButtons],
    }).catch(() => null);

    if (reviewMsg) await reviewMsg.react(config.reactions.submitted).catch(() => {});
  }
}

// ════════════════════════════════════════════════
//   Staff buttons (Accept / Deny / Interview / Waitlist)
// ════════════════════════════════════════════════
async function handleStaffButton(interaction, client) {
  if (!helpers.isStaff(interaction.member)) {
    return interaction.reply({ content: '❌ You do not have permission to do this.', ephemeral: true });
  }

  const parts   = interaction.customId.split('_'); // ['app', action, appId...]
  const action  = parts[1];
  const appId   = parts.slice(2).join('_');
  const app     = AM.getById(appId);

  if (!app) {
    return interaction.reply({ content: '❌ Application not found.', ephemeral: true });
  }
  if (app.status !== 'pending') {
    return interaction.reply({ content: `⚠️ This application has already been actioned (**${app.status}**).`, ephemeral: true });
  }

  // Show note modal
  const noteRequired = action === 'deny';
  const noteLabel    = {
    accept:    'Acceptance Note (optional)',
    deny:      'Denial Reason (required)',
    interview: 'Interview Note (optional)',
    waitlist:  'Waitlist Note (optional)',
  }[action] || 'Note';

  const modal = new ModalBuilder()
    .setCustomId(`staff_note_${action}_${appId}`)
    .setTitle(`${helpers.capitalise(action)} Application`);

  const noteInput = new TextInputBuilder()
    .setCustomId('note')
    .setLabel(noteLabel)
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(noteRequired)
    .setMaxLength(500);

  modal.addComponents(new ActionRowBuilder().addComponents(noteInput));
  await interaction.showModal(modal);
}

// ════════════════════════════════════════════════
//   Staff note modal submitted
// ════════════════════════════════════════════════
async function handleStaffNote(interaction, client) {
  await interaction.deferReply({ ephemeral: true });

  const parts  = interaction.customId.split('_'); // ['staff', 'note', action, appId...]
  const action = parts[2];
  const appId  = parts.slice(3).join('_');
  const note   = interaction.fields.getTextInputValue('note')?.trim() || null;

  const app = AM.getById(appId);
  if (!app) return interaction.editReply({ content: '❌ Application not found.' });
  if (app.status !== 'pending') return interaction.editReply({ content: `⚠️ Already actioned (${app.status}).` });

  const staffId = interaction.user.id;

  // Map action → status
  const statusMap = { accept: 'accepted', deny: 'denied', interview: 'interview', waitlist: 'waitlisted' };
  const newStatus = statusMap[action];
  if (!newStatus) return interaction.editReply({ content: '❌ Unknown action.' });

  AM.updateStatus(appId, { status: newStatus, reviewedBy: staffId, reviewNote: note });

  // Get applicant member
  const guild  = interaction.guild;
  const member = await guild.members.fetch(app.userId).catch(() => null);

  // ── Accept ────────────────────────────────────
  if (action === 'accept' && member) {
    const enlistResult = await helpers.enlistMember(member, app.answers.division, app.robloxData?.username || app.answers.roblox_username);
    const nickname = helpers.buildNickname(app.answers.division, app.robloxData?.username || app.answers.roblox_username);
    await member.user.send({ embeds: [embeds.acceptanceDM(app, nickname)] }).catch(() => {});
    if (enlistResult.errors.length) console.warn('[StaffAccept] Errors:', enlistResult.errors);
  }

  // ── Deny ──────────────────────────────────────
  if (action === 'deny') {
    if (member) await member.user.send({ embeds: [embeds.denialDM(app, note)] }).catch(() => {});

    // Auto-blacklist after N denials
    const denials = AM.getDenialCount(app.userId);
    if (denials >= config.autoBlacklistAfter) {
      AM.addBlacklist(app.userId, `Auto-blacklisted after ${denials} denials`, client.user.id);
      await interaction.followUp({
        content: `⚠️ <@${app.userId}> has been **auto-blacklisted** after ${denials} denials.`,
        ephemeral: true,
      }).catch(() => {});
    }
  }

  // ── Interview ─────────────────────────────────
  if (action === 'interview' && member) {
    await member.user.send({ embeds: [embeds.interviewDM(app)] }).catch(() => {});
  }

  // ── Waitlist ──────────────────────────────────
  if (action === 'waitlist' && member) {
    await member.user.send({ embeds: [embeds.waitlistDM(app, note)] }).catch(() => {});
  }

  // ── Audit log ─────────────────────────────────
  const auditChannel = guild.channels.cache.get(config.channels.auditLog);
  if (auditChannel) {
    await auditChannel.send({ embeds: [embeds.auditEmbed(app, staffId, newStatus, note)] }).catch(() => {});
  }

  // ── Update review message ─────────────────────
  try {
    const reviewChannel = guild.channels.cache.get(config.channels.staffReview);
    if (reviewChannel && interaction.message) {
      const reactionMap = { accepted: config.reactions.accepted, denied: config.reactions.denied, waitlisted: config.reactions.waitlist, interview: config.reactions.interview };
      await interaction.message.react(reactionMap[newStatus] || '📌').catch(() => {});
      await interaction.message.edit({ components: [] }).catch(() => {});
    }
  } catch (_) {}

  const confirmMsg = {
    accepted:   `✅ Application **accepted**. Roles and nickname assigned.`,
    denied:     `❌ Application **denied**. Applicant notified.`,
    interview:  `📋 **Interview requested**. Applicant notified.`,
    waitlisted: `🔁 Application **waitlisted**. Applicant notified.`,
  }[newStatus] || 'Done.';

  await interaction.editReply({ content: confirmMsg });
}
