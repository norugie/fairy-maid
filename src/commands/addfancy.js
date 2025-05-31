// Add Fancy command
const FancyFunctions = require("../messages/fancy_functions");
const BotFunctions = require("../bot_functions.js");
const Errors = require("../messages/errors.js");
const Colors = require("../messages/colors.js");

const { ChannelType } = require("discord.js");

function Run(client, msg, interaction = null, isDeferred = false) {
    let server_id, channel_id;
    
    // Handle both traditional commands and slash commands
    if (interaction) {
        // This is a slash command interaction
        server_id = interaction.guild.id;
        
        // Get channel from options
        const channel = interaction.options.getChannel('channel');
        channel_id = channel.id;
    } else {
        // This is a traditional prefix command
        const msgParams = BotFunctions.GetCommandParamaters(msg.content);
        server_id = msg.guild.id;
        channel_id = BotFunctions.GetMessageChannelID(msgParams[2]);
    }

    client.channels.fetch(channel_id).then(channel => {
        if (channel.type != ChannelType.GuildText) {
            if (interaction) {
                interaction.editReply({
                    embeds: [{
                        title: "Incorrect channel type!",
                        description: "The passed channel must be a text channel that you can post messages in.",
                        color: Colors["error"]
                    }]
                });
                return;
            }
            return BotFunctions.SimpleMessage(msg.channel, "The passed channel must be a text channel that you can post messages in.", "Incorrect channel type!", Colors["error"]);
        }
        
        if (interaction) {
            // For slash commands, we need to inform the user that this command requires interactive input
            interaction.editReply({
                embeds: [{
                    title: "Interactive Command",
                    description: "The fancy sticky command requires interactive input. Please use the traditional command `!sticky addfancy` instead.",
                    color: Colors["info"]
                }]
            });
            return;
        }
        
        // Traditional command handling
        FancyFunctions.GetMessagePropertiesFromUser(msg, (hex_color, title, message, media_url) => {
            global.stickies.AddFancySticky(server_id, channel_id, title, message, hex_color, (val) => { 
                if (typeof(val) == "string") {
                    return BotFunctions.SimpleMessage(msg.channel, val, "Error adding sticky!", Colors["error"]);
                }

                if (val) {
                    // If we have media, update the sticky to include it
                    if (media_url) {
                        global.stickies.EditSticky(server_id, channel_id, val, "media_url", media_url, (editResult) => {
                            if (!editResult) {
                                console.error("Failed to add media URL to fancy sticky");
                            }
                        });
                    }
                    
                    let successMessage = `
                        ID: ${val} 
                        Channel: ${channel.toString()}
                    `;
                    
                    if (media_url) {
                        successMessage += `
                        Media: Attached
                    `;
                    }
                    
                    BotFunctions.SimpleMessage(msg.channel, successMessage, "Created sticky!", Colors["success"], () => {
                        BotFunctions.ResetLastStickyTime(channel);
                        BotFunctions.ShowChannelStickies(server_id, channel, null);
                    });
                } else {
                    BotFunctions.SimpleMessage(msg.channel, "Unknown error, try again.", "Error adding sticky!", Colors["error"]);
                }
            }, media_url); // Pass the media URL to AddFancySticky
        });
    }).catch(_ => {
        if (interaction) {
            interaction.editReply({
                embeds: [{
                    title: "Error getting channel ID",
                    description: Errors["invalid_channel"],
                    color: Colors["error"]
                }]
            });
        } else {
            BotFunctions.SimpleMessage(msg.channel, Errors["invalid_channel"], "Error getting channel ID", Colors["error"]);
        }
    });
}

module.exports = {Run};
