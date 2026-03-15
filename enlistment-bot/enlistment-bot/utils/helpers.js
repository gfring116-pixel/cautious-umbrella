// ════════════════════════════════════════════════
//   utils/helpers.js
// ════════════════════════════════════════════════
const config = require('../config');

const VALID_DIVISIONS = ['infantry', 'militia', 'guard', 'navy'];

/**
 * Capitalise first letter of each word
 */
function capitalise(str) {
  return str.trim().replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Parse and validate division input from user
 * @returns {string|null} lowercase key or null
 */
function parseDivision(input) {
  const lower = input.trim().toLowerCase();
  return VALID_DIVISIONS.includes(lower) ? lower : null;
}

/**
 * Parse activity score — must be integer 1–10
 * @returns {number|null}
 */
function parseActivity(input) {
  const n = parseInt(input.trim(), 10);
  if (isNaN(n) || n < 1 || n > 10) return null;
  return n;
}

/**
 * Build the nickname string: {PREFIX} RobloxName
 */
function buildNickname(divisionKey, robloxUsername) {
  const div    = config.roles.divisions[divisionKey];
  const prefix = div ? `{${div.prefix}}` : '';
  return `${prefix} ${capitalise(robloxUsername)}`.trim();
}

/**
 * Assign division role + base enlisted role to a member, set nickname
 * Returns { rolesOk, nicknameOk, errors }
 */
async function enlistMember(member, divisionKey, robloxUsername) {
  const errors = [];
  let rolesOk = false, nicknameOk = false;

  const div = config.roles.divisions[divisionKey];

  // Assign roles
  try {
    const rolesToAdd = [config.roles.enlisted];
    if (div) rolesToAdd.push(div.id);

    for (const roleId of rolesToAdd) {
      const role = member.guild.roles.cache.get(roleId);
      if (role) await member.roles.add(role).catch(e => errors.push(`Role ${roleId}: ${e.message}`));
    }
    rolesOk = true;
  } catch (e) {
    errors.push(`Roles error: ${e.message}`);
  }

  // Set nickname
  try {
    const nick = buildNickname(divisionKey, robloxUsername);
    await member.setNickname(nick);
    nicknameOk = true;
  } catch (e) {
    errors.push(`Nickname error: ${e.message}`);
  }

  return { rolesOk, nicknameOk, errors };
}

/**
 * Strip all division roles + enlisted role, reset nickname
 */
async function dischargeMember(member) {
  const errors = [];

  // Remove all division roles
  for (const [, div] of Object.entries(config.roles.divisions)) {
    const role = member.guild.roles.cache.get(div.id);
    if (role && member.roles.cache.has(div.id)) {
      await member.roles.remove(role).catch(e => errors.push(e.message));
    }
  }

  // Remove enlisted role
  const enlistedRole = member.guild.roles.cache.get(config.roles.enlisted);
  if (enlistedRole && member.roles.cache.has(config.roles.enlisted)) {
    await member.roles.remove(enlistedRole).catch(e => errors.push(e.message));
  }

  // Reset nickname
  await member.setNickname(null).catch(e => errors.push(e.message));

  return errors;
}

/**
 * Check if interaction member has staff role
 */
function isStaff(member) {
  return member.roles.cache.has(config.roles.staffRole) || member.permissions.has('Administrator');
}

/**
 * Get the division key a member currently belongs to (by role)
 */
function getMemberDivision(member) {
  for (const [key, div] of Object.entries(config.roles.divisions)) {
    if (member.roles.cache.has(div.id)) return key;
  }
  return null;
}

/**
 * Format a timestamp to Discord relative time
 */
function relTime(isoOrMs) {
  const ms  = typeof isoOrMs === 'string' ? new Date(isoOrMs).getTime() : isoOrMs;
  const sec = Math.floor(ms / 1000);
  return `<t:${sec}:R>`;
}

function fullTime(isoOrMs) {
  const ms  = typeof isoOrMs === 'string' ? new Date(isoOrMs).getTime() : isoOrMs;
  const sec = Math.floor(ms / 1000);
  return `<t:${sec}:F>`;
}

module.exports = {
  capitalise, parseDivision, parseActivity,
  buildNickname, enlistMember, dischargeMember,
  isStaff, getMemberDivision, relTime, fullTime,
  VALID_DIVISIONS,
};
