// ════════════════════════════════════════════════
//   utils/susDetector.js
//   Scores a Discord GuildMember for suspicion
// ════════════════════════════════════════════════

const config = require('../config');

/**
 * @param {import('discord.js').GuildMember} member
 * @returns {{ score: number, breakdown: Array, level: string, levelEmoji: string }}
 */
function analyse(member) {
  const user    = member.user;
  const now     = Date.now();
  const created = user.createdTimestamp;
  const ageMs   = now - created;
  const ageDays = ageMs / (1000 * 60 * 60 * 24);

  const breakdown = [];

  // ── Account Age ───────────────────────────────
  if (ageDays < 1) {
    breakdown.push({ factor: 'Account created today',       points: 5, emoji: '🔴' });
  } else if (ageDays < 7) {
    breakdown.push({ factor: 'Account less than 7 days old', points: 4, emoji: '🔴' });
  } else if (ageDays < 30) {
    breakdown.push({ factor: 'Account less than 30 days old', points: 2, emoji: '🟡' });
  } else if (ageDays < 90) {
    breakdown.push({ factor: 'Account less than 90 days old', points: 1, emoji: '🟡' });
  }

  // ── Default Avatar ────────────────────────────
  if (!user.avatar) {
    breakdown.push({ factor: 'No profile picture (default avatar)', points: 2, emoji: '🟡' });
  }

  // ── Username patterns ─────────────────────────
  const username = user.username.toLowerCase();

  // 4+ consecutive digits
  if (/\d{4,}/.test(username)) {
    breakdown.push({ factor: 'Username contains 4+ consecutive numbers', points: 2, emoji: '🟡' });
  }

  // Very short username
  if (username.length < 4) {
    breakdown.push({ factor: 'Username is very short (< 4 characters)', points: 2, emoji: '🟡' });
  }

  // Looks like "user" + numbers
  if (/^user\d+$/i.test(username)) {
    breakdown.push({ factor: 'Username matches "user + numbers" alt pattern', points: 3, emoji: '🔴' });
  }

  // Underscore + numbers pattern (e.g. fureichs_57922)
  if (/_\d{3,}$/.test(username)) {
    breakdown.push({ factor: 'Username ends with underscore + numbers', points: 2, emoji: '🟡' });
  }

  // ── No badges / flags ─────────────────────────
  const flags = user.flags?.toArray() || [];
  if (flags.length === 0) {
    breakdown.push({ factor: 'No Discord badges or flags on account', points: 1, emoji: '⚪' });
  }

  // ── Server join vs account age ────────────────
  if (member.joinedTimestamp) {
    const joinedDaysAfterCreation = (member.joinedTimestamp - created) / (1000 * 60 * 60 * 24);
    if (joinedDaysAfterCreation < 1) {
      breakdown.push({ factor: 'Joined server same day account was created', points: 3, emoji: '🔴' });
    } else if (joinedDaysAfterCreation < 3) {
      breakdown.push({ factor: 'Joined server within 3 days of account creation', points: 2, emoji: '🟡' });
    }
  }

  // ── No mutual guilds info (can't check in bot, but note) ──

  const score = breakdown.reduce((sum, b) => sum + b.points, 0);
  const max   = 22; // theoretical max

  let level, levelEmoji, levelColor;
  if (score <= config.sus.autoApproveMax) {
    level = 'clean';      levelEmoji = '✅'; levelColor = 'Green';
  } else if (score <= config.sus.flaggedMax) {
    level = 'flagged';    levelEmoji = '⚠️'; levelColor = 'Yellow';
  } else {
    level = 'high_risk';  levelEmoji = '🚨'; levelColor = 'Red';
  }

  return { score, max, breakdown, level, levelEmoji, levelColor };
}

/**
 * Format the breakdown into a readable string for embeds
 */
function formatBreakdown(breakdown, score, max) {
  if (breakdown.length === 0) return '✅ No suspicious factors detected.';
  const lines = breakdown.map(b => `${b.emoji} ${b.factor} — **+${b.points}**`);
  lines.push(`${'─'.repeat(36)}`);
  lines.push(`**Total Sus Score: ${score} / ${max}**`);
  return lines.join('\n');
}

module.exports = { analyse, formatBreakdown };
