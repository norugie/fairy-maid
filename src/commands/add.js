// Add command
const BotFunctions = require("../bot_functions.js");
const Errors = require("../messages/errors.js");
const Colors = require("../messages/colors.js");

const { ChannelType } = require("discord.js");

function Run(client, msg) {
    const msgParams = BotFunctions.GetCommandParamaters(msg.content);
    const server_id = msg.guild.id;
    const channel_id = BotFunctions.GetMessageChannelID(msgParams[2]); 
    const originalMsg = msg.content.replace(msgParams[0], "").replace(msgParams[1], "").replace(msgParams[2], "");
    
    // Check for attachments in the message
    let mediaUrl = null;
    if (msg.attachments && msg.attachments.size > 0) {
        // Get the first attachment URL
        const attachment = msg.attachments.first();
        mediaUrl = attachment.url;
    }

    client.channels.fetch(channel_id).then(channel => {
        if (channel.type != ChannelType.GuildText) {
            return BotFunctions.SimpleMessage(msg.channel, "The passed channel must be a text channel that you can post messages in.", "Incorrect channel type!", Colors["error"]);
        }

        if (originalMsg.replace(" ", "").length <= 1 && !mediaUrl) {
            return BotFunctions.SimpleMessage(msg.channel, Errors["invalid_message"], "No message or media passed!", Colors["error"]);
        }
        
        BotFunctions.SimpleMessage(msg.channel, "Please wait while I add the sticky..", "Processing", Colors["sticky"], (sentMessage) => {
            global.stickies.AddSticky(server_id, channel_id, originalMsg, (val) => {
                if (typeof(val) == "string") {
                    return BotFunctions.SimpleMessage(msg.channel, val, "Error adding sticky!", Colors["error"], () => BotFunctions.DeleteMessage(sentMessage));
                }

                if (val) {
                    // If we have media, update the sticky to include it
                    if (mediaUrl) {
                        global.stickies.EditSticky(server_id, channel_id, val, "media_url", mediaUrl, (editResult) => {
                            if (!editResult) {
                                console.error("Failed to add media URL to sticky");
                            }
                        });
                    }
                    
                    let successMessage = `
                        ID: ${val} 
                        Channel: ${channel.toString()}
                    `;
                    
                    if (mediaUrl) {
                        successMessage += `
                        Media: Attached
                    `;
                    }
                    
                    BotFunctions.SimpleMessage(msg.channel, successMessage, "Created sticky!", Colors["success"], () => {
                        BotFunctions.DeleteMessage(sentMessage);
                        BotFunctions.ResetLastStickyTime(channel);
                        BotFunctions.ShowChannelStickies(server_id, channel, null);
                    });
                } else {
                    BotFunctions.SimpleMessage(msg.channel, "Unknown error, try again.", "Error adding sticky!", Colors["error"], () => BotFunctions.DeleteMessage(sentMessage));
                }
            }, mediaUrl); // Pass the media URL to AddSticky
        });
    }).catch(_ => {
        BotFunctions.SimpleMessage(msg.channel, Errors["invalid_channel"], "Error getting channel ID", Colors["error"]);
    });
}

module.exports = {Run};
