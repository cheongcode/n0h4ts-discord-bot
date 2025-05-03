# n0h4ts Discord Bot

A cybersecurity-focused Discord bot built with discord.js, featuring slash commands, temporary channels, and CVE information lookup.

## 🚀 Features

- Slash command support
- Temporary voice and text channels
- Message scheduling
- CVE information lookup via NIST API
- Server information display
- User information display
- Dynamic help command

## 📋 Command Reference

### 🔍 Basic Commands

| Command | Description | Usage |
|---------|-------------|-------|
| `/ping` | Basic health check | `/ping` |
| `/whoami` | Display your Discord user information | `/whoami` |
| `/serverinfo` | Show server details | `/serverinfo` |
| `/help` | List all available commands | `/help` |

### 🛡️ CVE Information

| Command | Description | Usage |
|---------|-------------|-------|
| `/cve` | Look up CVE information | `/cve id:CVE-2024-1234` |

**Returns:**
- CVE description
- Severity score from NIST database

### 🎤 Temporary Channels

| Command | Description | Usage |
|---------|-------------|-------|
| `/tempvc` | Create temporary voice channel | `/tempvc name:channel-name [user_limit:number]` |
| `/tempchat` | Create temporary text channel | `/tempchat name:channel-name` |

**Features:**
- Automatically deletes after 5 minutes of inactivity
- Created under "Temporary Channels" category
- Voice channels support user limits

### ⏰ Message Scheduling

| Command | Description | Usage |
|---------|-------------|-------|
| `/schedule` | Schedule, list, or delete messages | See below |

**Actions:**
1. Schedule a message:
   ```
   /schedule action:schedule message:"Your message" datetime:"2024-06-15 14:30"
   ```

2. List scheduled messages:
   ```
   /schedule action:list
   ```

3. Delete a scheduled message:
   ```
   /schedule action:delete job_id:123456789
   ```

**Time Formats Supported:**
- Full date: `"2024-06-15 14:30"`
- Time only: `"14:30"` (next occurrence)
- Relative: `"tomorrow 09:00"`

## ⚙️ Setup Guide

1. **Clone the repository:**
   ```bash
   git clone https://github.com/cheongcode/n0h4ts-discord-bot
   cd n0h4ts-discord-bot
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   Create `.env` file with:
   ```
   BOT_TOKEN=your_discord_bot_token
   CLIENT_ID=your_bot_application_id
   GUILD_ID=your_test_guild_id
   ```

4. **Register commands:**
   ```bash
   node src/deploy-commands.js
   ```
   This will show you a list of all available commands and their options.

5. **Start the bot:**
   ```bash
   npm run dev
   ```

## 🔧 Development

- Uses nodemon for development (auto-restart on changes)
- Command files: `src/commands/`
- Event handlers: `src/events/`
- Main entry: `src/index.js`

## 📝 Requirements

### Bot Permissions
- Send Messages
- View Channels
- Use Slash Commands
- Manage Channels (for temporary channels)
- Connect (for voice channels)

### Environment Variables
- `BOT_TOKEN`: Your Discord bot token
- `CLIENT_ID`: Your bot's application ID
- `GUILD_ID`: Your test server ID

## 🤝 Contributing

Feel free to submit issues and enhancement requests!
