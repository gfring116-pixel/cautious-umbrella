// ════════════════════════════════════════════════
//   utils/applicationManager.js
// ════════════════════════════════════════════════
const fs   = require('fs');
const path = require('path');

const DATA_PATH = path.resolve('./data/applications.json');

const DEFAULT_DATA = {
  applications: [],
  blacklist: [],
  stats: { total: 0, accepted: 0, denied: 0, pending: 0, waitlisted: 0, interview: 0 },
};

function ensureFile() {
  const dir = path.dirname(DATA_PATH);
  // /tmp always exists on Render, only create dir for local paths
  if (dir !== '/tmp' && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_PATH))
    fs.writeFileSync(DATA_PATH, JSON.stringify(DEFAULT_DATA, null, 2));
}

function read() {
  ensureFile();
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
}

function write(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

// ── Create ────────────────────────────────────
function createApplication({ userId, guildId, answers, susScore, susBreakdown, robloxData, status = 'pending' }) {
  const data = read();
  const app = {
    id: `APP-${Date.now()}`,
    userId,
    guildId,
    answers,       // { roblox_username, timezone, division, activity }
    susScore,
    susBreakdown,  // array of { factor, points }
    robloxData,    // { id, username, avatarUrl, created, displayName }
    status,
    reviewedBy: null,
    reviewNote: null,
    submittedAt: new Date().toISOString(),
    reviewedAt:  null,
  };
  data.applications.push(app);
  data.stats.total++;
  data.stats[status] = (data.stats[status] || 0) + 1;
  write(data);
  return app;
}

// ── Reads ─────────────────────────────────────
function getById(appId)  { return read().applications.find(a => a.id === appId) || null; }
function getPending()    { return read().applications.filter(a => a.status === 'pending').sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt)); }
function getStats()      { return read().stats; }
function getAll()        { return read().applications; }

function getByUserId(userId) {
  return read().applications
    .filter(a => a.userId === userId)
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
}

function getLatest(userId) { return getByUserId(userId)[0] || null; }
function getDenialCount(userId) { return getByUserId(userId).filter(a => a.status === 'denied').length; }

// ── Update status ─────────────────────────────
function updateStatus(appId, { status, reviewedBy, reviewNote }) {
  const data = read();
  const app  = data.applications.find(a => a.id === appId);
  if (!app) return null;
  if (data.stats[app.status] > 0) data.stats[app.status]--;
  app.status     = status;
  app.reviewedBy = reviewedBy || null;
  app.reviewNote = reviewNote || null;
  app.reviewedAt = new Date().toISOString();
  data.stats[status] = (data.stats[status] || 0) + 1;
  write(data);
  return app;
}

// ── Blacklist ─────────────────────────────────
function isBlacklisted(userId)       { return read().blacklist.some(b => b.userId === userId); }
function getBlacklistEntry(userId)   { return read().blacklist.find(b => b.userId === userId) || null; }
function getBlacklist()              { return read().blacklist; }

function addBlacklist(userId, reason, addedBy) {
  const data = read();
  if (!data.blacklist.find(b => b.userId === userId)) {
    data.blacklist.push({ userId, reason, addedBy, addedAt: new Date().toISOString() });
    write(data);
  }
}

function removeBlacklist(userId) {
  const data = read();
  data.blacklist = data.blacklist.filter(b => b.userId !== userId);
  write(data);
}

module.exports = {
  createApplication, getById, getByUserId, getLatest,
  getPending, getAll, getStats, updateStatus,
  isBlacklisted, getBlacklistEntry, addBlacklist,
  removeBlacklist, getBlacklist, getDenialCount,
};
