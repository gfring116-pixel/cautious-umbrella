# 🎖️ Colberg Grenadiers — Rekrut Enlistment Bot

A full-featured Discord enlistment & application bot with smart suspicion detection, Roblox verification, staff review tools, and automatic role/nickname assignment.

---

## 📁 File Structure

```
enlistment-bot/
├── index.js                  ← Start the bot
├── deploy-commands.js        ← Register slash commands (run once)
├── config.js                 ← ⚙️ ALL your IDs and settings go here
├── .env                      ← Your secret bot token
├── package.json
│
├── commands/
│   ├── panel.js              ← Post the enlistment panel
│   ├── app-status.js         ← Check application status
│   ├── app-review.js         ← List pending applications
│   ├── app-stats.js          ← Server-wide statistics
│   ├── app-history.js        ← Full application history for a user
│   ├── blacklist.js          ← Manage blacklist (add/remove/list/check)
│   ├── forceaccept.js        ← Manually accept an application
│   ├── forcedeny.js          ← Manually deny an application
│   ├── roster.js             ← View all enlisted by division
│   ├── whois.js              ← Full member profile card
│   └── discharge.js          ← Strip all roles and remove from regiment
│
├── events/
│   ├── ready.js              ← Bot startup
│   └── interactionCreate.js  ← All buttons, modals, commands
│
├── utils/
│   ├── applicationManager.js ← Read/write application data
│   ├── susDetector.js        ← Suspicion scoring logic
│   ├── roblox.js             ← Roblox API verification
│   ├── embeds.js             ← All embed builders
│   └── helpers.js            ← Role assigner, nickname setter
│
└── data/
    └── applications.json     ← Auto-created on first run
```

---

## 🚀 Setup Guide

### Step 1 — Create your bot

1. Go to [discord.dev/applications](https://discord.com/developers/applications)
2. Click **New Application** → name it (e.g. `Grenadier Bot`)
3. Go to **Bot** → click **Add Bot**
4. Under **Privileged Gateway Intents**, enable:
   - ✅ **Server Members Intent**
   - ✅ **Message Content Intent**
5. Copy your **Bot Token** (you'll need this in Step 3)
6. Go to **OAuth2 → URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: `Manage Roles`, `Manage Nicknames`, `Send Messages`, `Embed Links`, `Add Reactions`, `Use Slash Commands`
7. Open the generated URL and invite the bot to your server

---

### Step 2 — Install dependencies

```bash
npm install
```

---

### Step 3 — Configure the bot

**Create your `.env` file:**
```bash
cp .env.example .env
```

Edit `.env` and fill in:
```env
BOT_TOKEN=your_bot_token_here
CLIENT_ID=your_application_id_here   # From Developer Portal → General Information
GUILD_ID=your_server_id_here         # Right-click your server → Copy Server ID
```

**Edit `config.js`** and fill in your channel and role IDs:

```js
channels: {
  applicationLogs: 'PASTE_CHANNEL_ID',   // #application-logs
  staffReview:     'PASTE_CHANNEL_ID',   // #staff-review
  auditLog:        'PASTE_CHANNEL_ID',   // #audit-log
  training:        '1314617304595693640', // Already set ✅
},

roles: {
  enlisted:  '1424320589178601472',       // Already set ✅
  staffRole: 'PASTE_YOUR_STAFF_ROLE_ID',  // Who can use staff commands
  // Division roles are already set ✅
}
```

> **How to get IDs:** Enable Developer Mode in Discord (Settings → Advanced → Developer Mode), then right-click any channel/role and click **Copy ID**.

---

### Step 4 — Deploy slash commands

Run this **once** (and again any time you add/change commands):

```bash
node deploy-commands.js
```

---

### Step 5 — Start the bot

```bash
node index.js
```

Or with auto-restart on file changes (install nodemon first: `npm i -g nodemon`):
```bash
nodemon index.js
```

---

### Step 6 — Post the enlistment panel

In Discord, type:
```
/panel
```
in the channel you want the panel posted. Done!

---

## ⚙️ How It Works

### Application Flow
1. User clicks **Start Application**
2. Bot checks: blacklisted? already enlisted?
3. Modal pops up with 4 questions
4. Bot validates: division valid? activity 1–10? Roblox username real?
5. **Sus detection** runs on the Discord account
6. **Score 0–2** → Auto-approved instantly, roles + nickname assigned
7. **Score 3+** → Sent to `#staff-review` channel for human decision

### Sus Detection Scoring
| Factor | Points |
|--------|--------|
| Account created today | +5 |
| Account < 7 days old | +4 |
| Account < 30 days old | +2 |
| Account < 90 days old | +1 |
| Default avatar (no profile picture) | +2 |
| Username has 4+ consecutive numbers | +2 |
| Username < 4 characters | +2 |
| Username matches `user + numbers` pattern | +3 |
| Username ends with `_numbers` | +2 |
| No Discord badges/flags | +1 |
| Joined server same day account was created | +3 |
| Joined server within 3 days of account creation | +2 |

- **0–2** → ✅ Clean → Auto-approved
- **3–4** → ⚠️ Flagged → Staff review
- **5+**  → 🚨 High Risk → Staff review with red alert

### Nickname Format
`{PREFIX} RobloxName`

| Division | Prefix |
|----------|--------|
| Infantry | `{II.}` |
| Militia  | `{ML}`  |
| Guard    | `{GK}`  |
| Navy     | `{NV}`  |

e.g. Infantry + `danishjrs` → `{II.} Danishjrs`

---

## 📋 Commands

| Command | Access | Description |
|---------|--------|-------------|
| `/panel` | Staff | Post the enlistment panel |
| `/app-status` | Anyone | Check your own application status |
| `/app-status @user` | Staff | Check another user's status |
| `/app-review` | Staff | List all pending applications |
| `/app-stats` | Staff | View server-wide statistics |
| `/app-history @user` | Staff | Full application history |
| `/blacklist add @user [reason]` | Staff | Blacklist a user |
| `/blacklist remove @user` | Staff | Remove from blacklist |
| `/blacklist list` | Staff | View all blacklisted users |
| `/blacklist check @user` | Staff | Check if a user is blacklisted |
| `/forceaccept @user` | Staff | Manually accept an application |
| `/forcedeny @user [reason]` | Staff | Manually deny an application |
| `/roster` | Staff | View all enlisted by division |
| `/whois @user` | Staff | Full member profile card |
| `/discharge @user [reason]` | Staff | Remove from regiment |

---

## ⚠️ Important Notes

- The bot needs to have a **higher role** than the roles it assigns, otherwise it can't give roles.
- The bot needs **Manage Nicknames** permission and a higher role than the members it nicknames.
- Make sure the bot has **Send Messages** and **Embed Links** in all configured channels.
- Data is stored in `data/applications.json` — back this up periodically.
- Auto-blacklist kicks in after **3 denials** (configurable in `config.js`).

---

## 🛠️ Customisation

All settings live in `config.js`:
- Change `autoBlacklistAfter` to adjust denial threshold
- Change `sus.autoApproveMax` and `sus.flaggedMax` to tune the suspicion thresholds
- Change `serverName` and `serverEmoji` for branding
- Add/remove divisions in the `roles.divisions` object
