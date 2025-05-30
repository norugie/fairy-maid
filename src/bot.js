const findConfig = require("find-config");
require("dotenv").config({ path: findConfig(".env") });

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

const { Client, GatewayIntentBits, EmbedBuilder, ActivityType } = require("discord.js");
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const { Stickies } = require("./sticky.js");
global.stickies = new Stickies();

const { BoostManager } = require("./boost_manager.js");
global.boostManager = new BoostManager();

client.on("ready", () => {
    global.discordApplication = client.application;

    // Set the bot's status
    client.user.setPresence({
        activities: [{
            name: "definitely not napping (probably) 😴",
            type: ActivityType.Playing
        }],
        status: "online"
    });

    console.log(`Logged in as ${client.user.tag}! Status set to "Playing dusting the mansion"`);
    global.stickies.LoadStickies(client.guilds, () => {
        // Delete all Sticky bot messages in the last 50 messages for every server's channels
        for (const [server_id, server] of client.guilds.cache) {
            for (const [channel_id, channel] of server.channels.cache) {
                if (global.stickies.ValidStickyChannel(server_id, channel_id)) {
                    try {
                        channel.messages.fetch({ limit: 50 }).then(messages => {
                            for (const [_, message] of messages) {
                                if (message.author.bot && message.author.id == global.discordApplication.id) {
                                    //// Only remove sticky messages (So commands stay visible)
                                    //if (message.embeds[0] == null)
                                    BotFunctions.DeleteMessage(message);
                                }
                            }
                        }).then(() => {
                            BotFunctions.ShowChannelStickies(server_id, channel, null);
                        });
                    }
                    catch (error) {
                        console.error(error.message);
                    }
                }
            }
        }
    });
});

// Delete all stickies from a channel it's deleted
client.on("channelDelete", channel => {
    const server_id = channel.guild.id;
    global.stickies.RemoveChannelStickies(server_id, channel.id, () => {
        console.log(`Removed stickies for deleted channel ${channel.id} from server: ${server_id}`);
    });
});

// Delete all stickies from a server when it's deleted
client.on("guildDelete", guild => {
    global.stickies.RemoveServerStickies(guild.id, () => {
        console.log("Removed stickies from server: ", guild.id);
    });

    // Also remove any boost role configurations for this server
    global.boostManager.removeBoostRoles(guild.id);
});

// Listen for GuildMemberUpdate events to detect when a member stops boosting
client.on("guildMemberUpdate", (oldMember, newMember) => {
    // Check if the member was boosting before but isn't now
    const wasBooster = oldMember.premiumSince !== null;
    const isBooster = newMember.premiumSince !== null;

    if (wasBooster && !isBooster) {
        // Member stopped boosting
        global.boostManager.handleBoostRemoved(newMember);
    }
});

client.on("messageCreate", async (msg) => {
    // Originally it was gonna ignore all bots, but it probably makes more sense to just ignore itself
    //    if (msg.author.bot)
    //        return;
    if (msg.author.bot && msg.author.id == global.discordApplication.id)
        return;

    // Check if this is a fairy maid message and handle it
    const isFairyMaidMessage = await handleFairyMaidMessage(client, msg);
    if (isFairyMaidMessage) return; // Skip other processing if fairy maid handled the message

    const msgParams = BotFunctions.GetCommandParamaters(msg.content);

    if (msgParams[0] == "!sticky") {
        if (!msg.member.permissions.has("MANAGE_CHANNELS")) {
            BotFunctions.SimpleMessage(msg.channel, "You need the 'Manage Channels' permission.", "Insufficient Privileges!", Colors["error"]);
            return;
        }

        switch (msgParams[1]) {
            case "add": // Add a sticky
                AddCommand.Run(client, msg);
                break;
            case "addfancy": // Add a fancy sticky
                AddFancyCommand.Run(client, msg);
                break;
            case "edit": // Modify channel sticky
                EditCommand.Run(client, msg);
                break;
            case "remove": // Remove a sticky
                RemoveCommand.Run(client, msg);
                break;
            case "removeall":
                RemoveAllCommand.Run(client, msg);
                break;
            case "preview":
                PreviewCommand.Run(client, msg);
                break;
            case "previewfancy":
                PreviewFancyCommand.Run(client, msg);
                break;
            case "list": // List stickies from channel or all channels with stickies
                ListCommand.Run(client, msg);
                break;
            default:
                msg.channel.send({
                    embeds: [{
                        title: "Commands",
                        color: Colors["info"],
                        fields: [
                            {
                                name: "!sticky add <channel id> <discord message>",
                                value: "Add a sticky to a channel. You can also attach images, videos, or GIFs to your message."
                            },
                            {
                                name: "!sticky addfancy <channel id>",
                                value: "Start the process of creating a fancy sticky with a title, color, and message. You can include images, videos, or GIFs."
                            },
                            {
                                name: "!sticky edit <channel id> <sticky id>",
                                value: "Start the modification process for the provided sticky."
                            },
                            {
                                name: "!sticky remove <channel id> <sticky id>",
                                value: "Remove a sticky from a channel."
                            },
                            {
                                name: "!sticky removeall <channel id>",
                                value: "Remove all stickies from a channel."
                            },
                            {
                                name: "!sticky preview <message>",
                                value: "Preview what a sticky looks like."
                            },
                            {
                                name: "!sticky previewfancy",
                                value: "Start the process of creating and previewing a fancy sticky."
                            },
                            {
                                name: "!sticky list <channel id>",
                                value: "List stickies in a channel."
                            },
                            {
                                name: "!sticky list",
                                value: "List all channels with stickies."
                            }
                        ]
                    }]
                });
        }
    }
    else if (msgParams[0] == "!boost") {
        // Require ADMINISTRATOR permission for boost management commands
        if (!msg.member.permissions.has("ADMINISTRATOR")) {
            BotFunctions.SimpleMessage(msg.channel, "You need the 'Administrator' permission to manage boost roles.", "Insufficient Privileges!", Colors["error"]);
            return;
        }

        switch (msgParams[1]) {
            case "setroles": // Set roles to remove when a user stops boosting
                const roleIds = msgParams.slice(2);
                if (roleIds.length === 0) {
                    BotFunctions.SimpleMessage(msg.channel, "Please provide at least one role ID to set as a boost role.", "Missing Role IDs", Colors["error"]);
                    return;
                }

                global.boostManager.setBoostRoles(msg.guild.id, roleIds);
                BotFunctions.SimpleMessage(msg.channel, `Successfully set ${roleIds.length} role(s) to be removed when users stop boosting.`, "Boost Roles Set", Colors["success"]);
                break;

            case "listroles": // List roles that will be removed when a user stops boosting
                const configuredRoles = global.boostManager.getBoostRoles(msg.guild.id);

                if (configuredRoles.length === 0) {
                    BotFunctions.SimpleMessage(msg.channel, "No roles are currently configured to be removed when users stop boosting.", "No Boost Roles", Colors["info"]);
                    return;
                }

                let roleList = "";
                configuredRoles.forEach(roleId => {
                    const role = msg.guild.roles.cache.get(roleId);
                    roleList += `• ${role ? role.name : "Unknown Role"} (${roleId})\n`;
                });

                BotFunctions.SimpleMessage(msg.channel, `The following roles will be removed when users stop boosting:\n\n${roleList}`, "Configured Boost Roles", Colors["info"]);
                break;

            case "clearroles": // Clear all roles from boost management
                global.boostManager.removeBoostRoles(msg.guild.id);
                BotFunctions.SimpleMessage(msg.channel, "Successfully cleared all roles from boost management.", "Boost Roles Cleared", Colors["success"]);
                break;

            default:
                BotFunctions.SimpleMessage(msg.channel, "Available commands:\n• !boost setroles <role_id1> <role_id2> ... - Set roles to remove when users stop boosting\n• !boost listroles - List configured boost roles\n• !boost clearroles - Clear all boost roles", "Boost Management Commands", Colors["info"]);
        }
    }
    else {
        BotFunctions.ShowChannelStickies(msg.guild.id, msg.channel, null);
    }
});

client.login(process.env.BOT_TOKEN);
