// Removeall command
const BotFunctions = require("../bot_functions.js");
const Errors = require("../messages/errors.js");
const Colors = require("../messages/colors.js");

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
        // For slash commands, we can skip the initial message
        if (interaction) {
            processRemoval(null);
        } else {
            BotFunctions.SimpleMessage(msg.channel, `Please wait while I remove all stickies from: ${channel.toString()}`, "Processing", Colors["sticky"], processRemoval);
        }
        
        function processRemoval(sentMessage) {
            global.stickies.RemoveChannelStickies(server_id, channel_id, (val) => {
                if (typeof(val) == "string") {
                    if (interaction) {
                        interaction.editReply({
                            embeds: [{
                                title: "Error deleting stickies",
                                description: val,
                                color: Colors["error"]
                            }]
                        });
                        return;
                    }
                    return BotFunctions.SimpleMessage(msg.channel, val, "Error deleting stickies", Colors["error"], () => BotFunctions.DeleteMessage(sentMessage));
                }
                
                if (val) {    
                    BotFunctions.ResetLastStickyTime(channel);
                    BotFunctions.ShowChannelStickies(server_id, channel);
                    
                    if (interaction) {
                        interaction.editReply({
                            embeds: [{
                                title: "Deleted stickies",
                                description: `Successfully removed all stickies from: ${channel.toString()}`,
                                color: Colors["success"]
                            }]
                        });
                    } else {
                        BotFunctions.SimpleMessage(msg.channel, `Successfully removed all stickies from: ${channel.toString()}`, "Deleted stickies", Colors["success"], () => BotFunctions.DeleteMessage(sentMessage));
                    }
                } else {
                    if (interaction) {
                        interaction.editReply({
                            embeds: [{
                                title: "Error deleting stickies",
                                description: "There were no stickies in that channel.",
                                color: Colors["error"]
                            }]
                        });
                    } else {
                        BotFunctions.SimpleMessage(msg.channel, "There were no stickies in that channel.", "Error deleting stickies", Colors["error"], () => BotFunctions.DeleteMessage(sentMessage));
                    }
                }
            });
        }
    }).catch(error => {
        console.error(error);
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
