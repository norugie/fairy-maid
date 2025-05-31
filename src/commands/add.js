// Add command
const BotFunctions = require("../bot_functions.js");
const Errors = require("../messages/errors.js");
const Colors = require("../messages/colors.js");

const { ChannelType } = require("discord.js");

function Run(client, msg, interaction = null, isDeferred = false) {
    let server_id, channel_id, originalMsg, mediaUrl = null;
    
    // Handle both traditional commands and slash commands
    if (interaction) {
        // This is a slash command interaction
        server_id = interaction.guild.id;
        
        // Get channel from options
        const channel = interaction.options.getChannel('channel');
        channel_id = channel.id;
        
        // Get message from options
        originalMsg = interaction.options.getString('message');
        
        // Check for attachment in options
        const attachment = interaction.options.getAttachment('media');
        if (attachment) {
            mediaUrl = attachment.url;
        }
    } else {
        // This is a traditional prefix command
        const msgParams = BotFunctions.GetCommandParamaters(msg.content);
        server_id = msg.guild.id;
        channel_id = BotFunctions.GetMessageChannelID(msgParams[2]); 
        originalMsg = msg.content.replace(msgParams[0], "").replace(msgParams[1], "").replace(msgParams[2], "");
        
        // Check for attachments in the message
        if (msg.attachments && msg.attachments.size > 0) {
            // Get the first attachment URL
            const attachment = msg.attachments.first();
            mediaUrl = attachment.url;
        }
    }

    client.channels.fetch(channel_id).then(channel => {
        if (channel.type != ChannelType.GuildText) {
            return BotFunctions.SimpleMessage(msg.channel, "The passed channel must be a text channel that you can post messages in.", "Incorrect channel type!", Colors["error"]);
        }

        if (originalMsg.replace(" ", "").length <= 1 && !mediaUrl) {
            return BotFunctions.SimpleMessage(msg.channel, Errors["invalid_message"], "No message or media passed!", Colors["error"]);
        }
        
        // Determine which channel to send messages to
        const responseChannel = interaction ? interaction.channel : msg.channel;
        
        // If this is a slash command interaction, we've already deferred the reply
        if (interaction) {
            processSticky(null);
        } else {
            BotFunctions.SimpleMessage(responseChannel, "Please wait while I add the sticky..", "Processing", Colors["sticky"], processSticky);
        }
        
        function processSticky(sentMessage) {
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
                    
                    BotFunctions.SimpleMessage(responseChannel, successMessage, "Created sticky!", Colors["success"], () => {
                        if (sentMessage) BotFunctions.DeleteMessage(sentMessage);
                        if (interaction && interaction.deferred) interaction.editReply({ content: 'Sticky created successfully!' });
                        BotFunctions.ResetLastStickyTime(channel);
                        BotFunctions.ShowChannelStickies(server_id, channel, null);
                    });
                } else {
                    BotFunctions.SimpleMessage(responseChannel, "Unknown error, try again.", "Error adding sticky!", Colors["error"], () => {
                        if (sentMessage) BotFunctions.DeleteMessage(sentMessage);
                        if (interaction && interaction.deferred) interaction.editReply({ content: 'Error adding sticky!' });
                    });
                }
            }, mediaUrl); // Pass the media URL to AddSticky
        }
    }).catch(_ => {
        const responseChannel = interaction ? interaction.channel : msg.channel;
        BotFunctions.SimpleMessage(responseChannel, Errors["invalid_channel"], "Error getting channel ID", Colors["error"]);
        if (interaction && interaction.deferred) {
            interaction.editReply({ content: 'Error: Invalid channel' });
        }
    });
}

module.exports = {Run};
