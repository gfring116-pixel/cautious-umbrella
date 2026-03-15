// ════════════════════════════════════════════════
//   utils/roblox.js
//   Roblox API helpers
// ════════════════════════════════════════════════
const axios = require('axios');

/**
 * Fetch Roblox user by username.
 * Returns null if not found.
 * @returns {{ id, username, displayName, created, avatarUrl } | null}
 */
async function getRobloxUser(username) {
  try {
    // Step 1: resolve username → user ID
    const res = await axios.post(
      'https://users.roblox.com/v1/usernames/users',
      { usernames: [username], excludeBannedUsers: false },
      { timeout: 8000 }
    );

    const users = res.data?.data;
    if (!users || users.length === 0) return null;

    const user = users[0];

    // Step 2: fetch full profile
    const profileRes = await axios.get(
      `https://users.roblox.com/v1/users/${user.id}`,
      { timeout: 8000 }
    );
    const profile = profileRes.data;

    // Step 3: fetch avatar thumbnail
    let avatarUrl = null;
    try {
      const avatarRes = await axios.get(
        `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=150x150&format=Png&isCircular=false`,
        { timeout: 8000 }
      );
      avatarUrl = avatarRes.data?.data?.[0]?.imageUrl || null;
    } catch (_) { /* avatar is optional */ }

    return {
      id:          user.id,
      username:    profile.name,
      displayName: profile.displayName,
      description: profile.description || '',
      created:     profile.created,      // ISO string
      avatarUrl,
    };
  } catch (err) {
    // Network error or Roblox API down — treat as unverifiable (don't block)
    if (err.response?.status === 404) return null;
    console.error('[Roblox API]', err.message);
    return null;
  }
}

/**
 * Format account age from ISO string to human-readable
 */
function formatAge(isoString) {
  const created = new Date(isoString);
  const now     = new Date();
  const years   = now.getFullYear() - created.getFullYear();
  const months  = now.getMonth()    - created.getMonth() + years * 12;
  if (months >= 12) {
    const y = Math.floor(months / 12);
    const m = months % 12;
    return m > 0 ? `${y}y ${m}mo` : `${y}y`;
  }
  if (months > 0) return `${months}mo`;
  const days = Math.floor((now - created) / 86400000);
  return `${days}d`;
}

module.exports = { getRobloxUser, formatAge };
