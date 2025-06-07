// Load environment variables directly
require("dotenv").config();

const BotFunctions = require("./bot_functions.js");
const Colors = require("./messages/colors.js");

const AddCommand = require("./commands/add.js");
const AddFancyCommand = require("./commands/addfancy.js");
const EditCommand = require("./commands/edit.js");
const RemoveCommand = require("./commands/remove.js");
const RemoveAllCommand = require("./commands/removeall.js");
const PreviewCommand = require("./commands/preview.js");
const PreviewFancyCommand = require("./commands/previewfancy.js");
const ListCommand = require("./commands/list.js");

// Import fairy maid functionality
const { handleFairyMaidMessage } = require("./fairy_maid.js");

const { Client, GatewayIntentBits, EmbedBuilder, ActivityType, Events } = require("discord.js");

// Import slash command handlers
const { registerCommands, handleInteraction } = require("./slash_commands.js");
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// const { Stickies } = require("./sticky.js");
// global.stickies = new Stickies();

// const { BoostManager } = require("./boost_manager.js");
// global.boostManager = new BoostManager();

// Initialize the memory manager globally
const { MemoryManager } = require("./memory_manager.js");
global.memoryManager = new MemoryManager();

client.on(Events.ClientReady, () => {
    global.discordApplication = client.application;

    // Set the bot's status
    client.user.setPresence({
        activities: [{
            name: "the Mansion; plotting mischief! 🌟",
            type: ActivityType.Watching
        }],
        status: "online"
    });

    console.log(`Logged in as ${client.user.tag}! Status set to "Watching the Mansion; plotting mischief! 🌟"`);
    
    // Register slash commands
    registerCommands(client);
    // global.stickies.LoadStickies(client.guilds, () => {
    //     // Delete all Sticky bot messages in the last 50 messages for every server's channels
    //     for (const [server_id, server] of client.guilds.cache) {
    //         for (const [channel_id, channel] of server.channels.cache) {
    //             if (global.stickies.ValidStickyChannel(server_id, channel_id)) {
    //                 try {
    //                     channel.messages.fetch({ limit: 50 }).then(messages => {
    //                         for (const [_, message] of messages) {
    //                             if (message.author.bot && message.author.id == global.discordApplication.id) {
    //                                 //// Only remove sticky messages (So commands stay visible)
    //                                 //if (message.embeds[0] == null)
    //                                 BotFunctions.DeleteMessage(message);
    //                             }
    //                         }
    //                     }).then(() => {
    //                         BotFunctions.ShowChannelStickies(server_id, channel, null);
    //                     });
    //                 }
    //                 catch (error) {
    //                     console.error(error.message);
    //                 }
    //             }
    //         }
    //     }
    // });
});

// Delete all stickies from a channel it's deleted
// client.on(Events.ChannelDelete, channel => {
//     const server_id = channel.guild.id;
//     global.stickies.RemoveChannelStickies(server_id, channel.id, () => {
//         console.log(`Removed stickies for deleted channel ${channel.id} from server: ${server_id}`);
//     });
// });

// Delete all stickies from a server when it's deleted
// client.on(Events.GuildDelete, guild => {
//     global.stickies.RemoveServerStickies(guild.id, () => {
//         console.log("Removed stickies from server: ", guild.id);
//     });
//
//     // Also remove any boost role configurations for this server
//     global.boostManager.removeBoostRoles(guild.id);
// });

// Listen for GuildMemberUpdate events to detect when a member stops boosting
client.on(Events.GuildMemberUpdate, (oldMember, newMember) => {
    // Check if the member was boosting before but isn't now
    const wasBooster = oldMember.premiumSince !== null;
    const isBooster = newMember.premiumSince !== null;

    if (wasBooster && !isBooster) {
        // Member stopped boosting
        global.boostManager.handleBoostRemoved(newMember);
    }
});

// Handle slash command interactions
client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isChatInputCommand()) {
        await handleInteraction(interaction);
    }
});

// Handle traditional prefix commands
client.on(Events.MessageCreate, async (msg) => {
    // Originally it was gonna ignore all bots, but it probably makes more sense to just ignore itself
    //    if (msg.author.bot)
    //        return;
    if (msg.author.bot && msg.author.id == global.discordApplication.id)
        return;

    // Check if this is a fairy maid message and handle it
    const isFairyMaidMessage = await handleFairyMaidMessage(client, msg);
    if (isFairyMaidMessage) return; // Skip other processing if fairy maid handled the message
    //
    //     switch (msgParams[1]) {
    //         case "setroles": // Set roles to remove when a user stops boosting
    //             const roleIds = msgParams.slice(2);
    //             if (roleIds.length === 0) {
    //                 BotFunctions.SimpleMessage(msg.channel, "Please provide at least one role ID to set as a boost role.", "Missing Role IDs", Colors["error"]);
    //                 return;
    //             }
    //
    //             global.boostManager.setBoostRoles(msg.guild.id, roleIds);
    //             BotFunctions.SimpleMessage(msg.channel, `Successfully set ${roleIds.length} role(s) to be removed when users stop boosting.`, "Boost Roles Set", Colors["success"]);
    //             break;
    //
    //         case "listroles": // List roles that will be removed when a user stops boosting
    //             const configuredRoles = global.boostManager.getBoostRoles(msg.guild.id);
    //
    //             if (configuredRoles.length === 0) {
    //                 BotFunctions.SimpleMessage(msg.channel, "No roles are currently configured to be removed when users stop boosting.", "No Boost Roles", Colors["info"]);
    //                 return;
    //             }
    //
    //             let roleList = "";
    //             configuredRoles.forEach(roleId => {
    //                 const role = msg.guild.roles.cache.get(roleId);
    //                 roleList += `• ${role ? role.name : "Unknown Role"} (${roleId})\n`;
    //             });
    //
    //             BotFunctions.SimpleMessage(msg.channel, `The following roles will be removed when users stop boosting:\n\n${roleList}`, "Configured Boost Roles", Colors["info"]);
    //             break;
    //
    //         case "clearroles": // Clear all roles from boost management
    //             global.boostManager.removeBoostRoles(msg.guild.id);
    //             BotFunctions.SimpleMessage(msg.channel, "Successfully cleared all roles from boost management.", "Boost Roles Cleared", Colors["success"]);
    //             break;
    //
    //         default:
    //             BotFunctions.SimpleMessage(msg.channel, "Available commands:\n• !boost setroles <role_id1> <role_id2> ... - Set roles to remove when users stop boosting\n• !boost listroles - List configured boost roles\n• !boost clearroles - Clear all boost roles", "Boost Management Commands", Colors["info"]);
    //     }
    // }
    // else {
    //     BotFunctions.ShowChannelStickies(msg.guild.id, msg.channel, null);
    // }
});

client.login(process.env.BOT_TOKEN);
