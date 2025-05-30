// Edit command
const BotFunctions = require("../bot_functions.js");
const Errors = require("../messages/errors.js");
const Colors = require("../messages/colors.js");

const { resolveColor } = require("discord.js");

function Run(client, msg) {
    const msgParams = BotFunctions.GetCommandParamaters(msg.content);
    const server_id = msg.guild.id;
    const channel_id = BotFunctions.GetMessageChannelID(msgParams[2]);
    const sticky_id = msgParams[3];

    client.channels.fetch(channel_id).then(channel => {
        if (!global.stickies.ValidSticky(server_id, channel_id, sticky_id))
            return BotFunctions.SimpleMessage(msg.channel, Errors["no_sticky_id"], "Error editing sticky", Colors["error"]);  
        
        BotFunctions.SimpleMessage(msg.channel, `What are you wanting to change for #${sticky_id} sticky? (message | title | color | media)`, "Which property?", Colors["question"], (sentMessage) => {  
            BotFunctions.WaitForUserResponse(msg.channel, msg.member, 20000, response => {
                const response_content = response.content.toLowerCase();
                const key = response_content == "color" ? "hex_color" : (response_content == "media" ? "media_url" : response_content);

                BotFunctions.DeleteMessage(sentMessage);

                if (key !== "message" && key !== "title" && key !== "hex_color" && key !== "is_embed" && key !== "media_url") {
                    BotFunctions.SimpleMessage(msg.channel, "The value you provided is not a valid sticky property.", "Error", Colors["error"]);
                    return Run(client, msg); // Restart command 
                }
                
                // Handle media_url specially
                if (key === "media_url") {
                    BotFunctions.SimpleMessage(msg.channel, `What do you want to do with #${sticky_id} sticky's media? (upload | url | remove)`, "Media Options", Colors["question"], (sentMessage) => {
                        BotFunctions.WaitForUserResponse(msg.channel, msg.member, 40000, response => {
                            BotFunctions.DeleteMessage(sentMessage);
                            const mediaAction = response.content.toLowerCase();
                            
                            if (mediaAction === "remove") {
                                // Remove media by setting media_url to null
                                BotFunctions.SimpleMessage(msg.channel, `Please wait while I remove the media from that sticky...`, "Processing", Colors["sticky"], (sentMessage) => {
                                    global.stickies.EditSticky(server_id, channel_id, sticky_id, "media_url", null, (val) => {
                                        if (typeof(val) == "string")
                                            return BotFunctions.SimpleMessage(msg.channel, val, "Error removing media", Colors["error"], () => BotFunctions.DeleteMessage(sentMessage));
                                        
                                        if (val) {
                                            BotFunctions.SimpleMessage(msg.channel, `Successfully removed media from Sticky #${sticky_id}.`, "Modified sticky", Colors["success"], () => BotFunctions.DeleteMessage(sentMessage)); 
                                            BotFunctions.ResetLastStickyTime(channel);
                                            BotFunctions.ShowChannelStickies(server_id, channel, null);
                                        } else
                                            BotFunctions.SimpleMessage(msg.channel, Errors["no_sticky_id"], "Error editing sticky", Colors["error"], () => BotFunctions.DeleteMessage(sentMessage));  
                                    });
                                });
                            } else if (mediaAction === "upload") {
                                // Ask for an upload
                                BotFunctions.SimpleMessage(msg.channel, `Please upload the image, video, or GIF you want to use for Sticky #${sticky_id}.`, "Upload Media", Colors["question"], (sentMessage) => {
                                    BotFunctions.WaitForUserResponse(msg.channel, msg.member, 120000, response => {
                                        BotFunctions.DeleteMessage(sentMessage);
                                        
                                        let mediaUrl = null;
                                        if (response.attachments && response.attachments.size > 0) {
                                            // Get the first attachment URL
                                            const attachment = response.attachments.first();
                                            mediaUrl = attachment.url;
                                            
                                            BotFunctions.SimpleMessage(msg.channel, `Please wait while I update that sticky's media...`, "Processing", Colors["sticky"], (sentMessage) => {
                                                global.stickies.EditSticky(server_id, channel_id, sticky_id, "media_url", mediaUrl, (val) => {
                                                    if (typeof(val) == "string")
                                                        return BotFunctions.SimpleMessage(msg.channel, val, "Error updating media", Colors["error"], () => BotFunctions.DeleteMessage(sentMessage));
                                                    
                                                    if (val) {
                                                        BotFunctions.SimpleMessage(msg.channel, `Successfully updated media for Sticky #${sticky_id}.`, "Modified sticky", Colors["success"], () => BotFunctions.DeleteMessage(sentMessage)); 
                                                        BotFunctions.ResetLastStickyTime(channel);
                                                        BotFunctions.ShowChannelStickies(server_id, channel, null);
                                                    } else
                                                        BotFunctions.SimpleMessage(msg.channel, Errors["no_sticky_id"], "Error editing sticky", Colors["error"], () => BotFunctions.DeleteMessage(sentMessage));  
                                                });
                                            });
                                        } else {
                                            BotFunctions.SimpleMessage(msg.channel, "No media was uploaded. Please try again.", "Error", Colors["error"]);
                                        }
                                    });
                                });
                            } else if (mediaAction === "url") {
                                // Ask for a URL
                                BotFunctions.SimpleMessage(msg.channel, `Please enter the URL of the image, video, or GIF you want to use for Sticky #${sticky_id}.`, "Enter URL", Colors["question"], (sentMessage) => {
                                    BotFunctions.WaitForUserResponse(msg.channel, msg.member, 120000, response => {
                                        BotFunctions.DeleteMessage(sentMessage);
                                        
                                        const mediaUrl = response.content.trim();
                                        if (mediaUrl.match(/^https?:\/\/.+\.(jpeg|jpg|gif|png|mp4|webm|webp)$/i)) {
                                            BotFunctions.SimpleMessage(msg.channel, `Please wait while I update that sticky's media...`, "Processing", Colors["sticky"], (sentMessage) => {
                                                global.stickies.EditSticky(server_id, channel_id, sticky_id, "media_url", mediaUrl, (val) => {
                                                    if (typeof(val) == "string")
                                                        return BotFunctions.SimpleMessage(msg.channel, val, "Error updating media", Colors["error"], () => BotFunctions.DeleteMessage(sentMessage));
                                                    
                                                    if (val) {
                                                        BotFunctions.SimpleMessage(msg.channel, `Successfully updated media for Sticky #${sticky_id}.`, "Modified sticky", Colors["success"], () => BotFunctions.DeleteMessage(sentMessage)); 
                                                        BotFunctions.ResetLastStickyTime(channel);
                                                        BotFunctions.ShowChannelStickies(server_id, channel, null);
                                                    } else
                                                        BotFunctions.SimpleMessage(msg.channel, Errors["no_sticky_id"], "Error editing sticky", Colors["error"], () => BotFunctions.DeleteMessage(sentMessage));  
                                                });
                                            });
                                        } else {
                                            BotFunctions.SimpleMessage(msg.channel, "The URL you provided doesn't appear to be a valid media URL. Please try again.", "Error", Colors["error"]);
                                        }
                                    });
                                });
                            } else {
                                BotFunctions.SimpleMessage(msg.channel, "Invalid option. Please try again.", "Error", Colors["error"]);
                            }
                        });
                    });
                } else {
                    // Handle other properties normally
                    BotFunctions.SimpleMessage(msg.channel, `What do you want to set #${sticky_id} sticky's ${key} to?`, "What value?", Colors["question"], (sentMessage) => {  
                        BotFunctions.WaitForUserResponse(msg.channel, msg.member, key == "message" ? 600000 : 40000, response => {
                            BotFunctions.DeleteMessage(sentMessage);

                            if (key == "hex_color") {
                                try {
                                    resolveColor(response.content);
                                } catch(err) {
                                    BotFunctions.SimpleMessage(msg.channel, "The color you passed is not valid", "Incorrect color!", Colors["error"]);
                                    return Run(client, msg); // Restart command.
                                }
                            }
                            
                            BotFunctions.SimpleMessage(msg.channel, `Please wait while I change that sticky's ${key}...`, "Processing", Colors["sticky"], (sentMessage) => {
                                global.stickies.EditSticky(server_id, channel_id, sticky_id, key, response.content, (val) => {
                                    if (typeof(val) == "string")
                                        return BotFunctions.SimpleMessage(msg.channel, val, "Error changing sticky", Colors["error"], () => BotFunctions.DeleteMessage(sentMessage));
                                    
                                    if (val) {
                                        BotFunctions.SimpleMessage(msg.channel, `Successfully changed Sticky #${sticky_id}'s ${key}.`, "Modified sticky", Colors["success"], () => BotFunctions.DeleteMessage(sentMessage)); 
                                        BotFunctions.ResetLastStickyTime(channel);
                                        BotFunctions.ShowChannelStickies(server_id, channel, null);
                                    } else
                                        BotFunctions.SimpleMessage(msg.channel, Errors["no_sticky_id"], "Error editing sticky", Colors["error"], () => BotFunctions.DeleteMessage(sentMessage));  
                                });
                            });
                        });
                    });
                }
            });
        });
    }).catch((error) => {
        BotFunctions.SimpleMessage(msg.channel, Errors["invalid_channel"], "Error getting channel ID", Colors["error"]);
    });
}

module.exports = {Run};
