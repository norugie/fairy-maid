[![issues](https://img.shields.io/github/issues/Ethorbit/Discord_Sticky-Message-Bot)](https://github.com/Ethorbit/Discord_Sticky-Message-Bot/issues?q=is%3Aopen+is%3Aissue)
[![docker-build](https://github.com/Ethorbit/Discord_Sticky-Message-Bot/actions/workflows/docker-image.yml/badge.svg)](https://github.com/Ethorbit/Discord_Sticky-Message-Bot/actions/workflows/docker-image.yml)

# Discord_Sticky-Message-Bot 

A bot that keeps important stuff at the bottom of channels and manages server boost roles.

![Example Image](example.png)

## [Tutorial](https://github.com/Ethorbit/Discord_Sticky-Message-Bot/wiki) | [Commands](https://github.com/Ethorbit/Discord_Sticky-Message-Bot/wiki/Bot-Commands) 

## Commands

### Sticky Message Commands
- `!sticky add <channel id> <message>` - Add a sticky to a channel. You can also attach images, videos, or GIFs to your message.
- `!sticky addfancy <channel id>` - Start the process of adding a fancy sticky to a channel. You can include images, videos, or GIFs.
- `!sticky edit <channel id> <sticky id>` - Start the modification process for the provided sticky.
- `!sticky remove <channel id> <sticky id>` - Remove a sticky from a channel.
- `!sticky removeall <channel id>` - Remove all stickies from a channel.
- `!sticky preview <message>` - Preview what a sticky looks like.
- `!sticky previewfancy` - Start the process of creating and previewing a fancy sticky.
- `!sticky list <channel id>` - List stickies in a channel.
- `!sticky list` - List all channels with stickies.

### Boost Role Management Commands
- `!boost setroles <role_id1> <role_id2> ...` - Set roles to be removed when users stop boosting
- `!boost listroles` - List roles configured to be removed when users stop boosting
- `!boost clearroles` - Clear all roles from boost management

### Features:
* Sticky messages (Keeps important messages at the bottom of channels)
* Fancy stickies (Create embedded stickies with titles and colors)
* Media support (Images, videos, GIFs in stickies)
* Multi-server support
* Multiple stickies per channel
* Sticky editing
* Sticky previewing
* Fast sticky management (All data is cached from the local database on start)
* Channel-based timers for sticky cooldowns which reset when users send messages
* Auto Sticky replacement (Keeps only 1 copy of a sticky message to prevent spam)
* Server Boost Role Management
  - Automatically remove specified roles when users stop boosting the server
  - Configure multiple roles to be removed
  - Easy-to-use commands for administrators

## Setup

1. Clone the repository
2. Install dependencies with `npm install`
3. Create a `.env` file with your bot token:
   ```
   BOT_TOKEN=your_discord_bot_token
   ```
4. Run the bot with `node src/bot.js`

## Permissions Required

- The bot needs the following permissions:
  - Read/Send Messages
  - Manage Messages
  - Manage Roles (for boost role management)
  - View Channels

## Configuration

- Sticky messages are stored in a SQLite database (`bot.db`)
- Boost role configurations are stored in `boost_config.json`
