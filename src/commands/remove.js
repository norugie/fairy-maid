// Remove command
const BotFunctions = require("../bot_functions.js");
const Errors = require("../messages/errors.js");
const Colors = require("../messages/colors.js");

function Run(client, msg, interaction = null, isDeferred = false) {
    let server_id, channel_id, sticky_id;
    
    // Handle both traditional commands and slash commands
    if (interaction) {
        // This is a slash command interaction
        server_id = interaction.guild.id;
        
        // Get channel and sticky ID from options
        const channel = interaction.options.getChannel('channel');
        channel_id = channel.id;
        
        // Get sticky ID from options
        sticky_id = interaction.options.getInteger('id');
    } else {
        // This is a traditional prefix command
        const msgParams = BotFunctions.GetCommandParamaters(msg.content);
        server_id = msg.guild.id;
        channel_id = BotFunctions.GetMessageChannelID(msgParams[2]); 
        sticky_id = msgParams[3];
    }

    client.channels.fetch(channel_id).then(channel => {
        if (sticky_id == null) {
            if (interaction) {
                interaction.editReply({
                    embeds: [{
                        title: "No sticky ID passed!",
                        description: "Please provide a valid sticky ID.",
                        color: Colors["error"]
                    }]
                });
                return;
            }
            BotFunctions.SimpleMessage(msg.channel, "Example: !sticky remove 798815345905106945 6", "No sticky ID passed!", Colors["error"]);
        }
        else {
            // For slash commands, we can skip the initial message
            if (interaction) {
                processRemoval(null);
            } else {
                BotFunctions.SimpleMessage(msg.channel, "Please wait while I remove that sticky..", "Processing", Colors["sticky"], processRemoval);
            }
            
            function processRemoval(sentMessage) {
                global.stickies.RemoveSticky(server_id, channel_id, sticky_id, (val, messageStr) => {
                    if (typeof(val) == "string") {
                        if (interaction) {
                            interaction.editReply({
                                embeds: [{
                                    title: "Error deleting sticky",
                                    description: val,
                                    color: Colors["error"]
                                }]
                            });
                            return;
                        }
                        return BotFunctions.SimpleMessage(msg.channel, val, "Error deleting sticky", Colors["error"], () => BotFunctions.DeleteMessage(sentMessage));
                    }

                    if (val) { 
                        BotFunctions.ResetLastStickyTime(channel);
                        BotFunctions.ShowChannelStickies(server_id, channel);
                        
                        if (interaction) {
                            interaction.editReply({
                                embeds: [{
                                    title: "Deleted sticky",
                                    description: `Successfully removed Sticky #${sticky_id} from ${channel.toString()}`,
                                    color: Colors["success"]
                                }]
                            });
                        } else {
                            BotFunctions.SimpleMessage(msg.channel, `Successfully removed Sticky #${sticky_id} from ${channel.toString()}`, "Deleted sticky", Colors["success"], () => BotFunctions.DeleteMessage(sentMessage)); 
                        }
                    } else {
                        if (interaction) {
                            interaction.editReply({
                                embeds: [{
                                    title: "Error deleting sticky",
                                    description: Errors["no_sticky_id"],
                                    color: Colors["error"]
                                }]
                            });
                        } else {
                            BotFunctions.SimpleMessage(msg.channel, Errors["no_sticky_id"], "Error deleting sticky", Colors["error"], () => BotFunctions.DeleteMessage(sentMessage));
                        }
                    }
                });
            }
        }
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
