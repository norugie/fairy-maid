const BotFunctions = require("../bot_functions.js");
const Colors = require("../messages/colors.js");

const CancelText = "The fancy sticky process has cancelled."

const { resolveColor } = require("discord.js");

function GetMessagePropertiesFromUser(msg, cb) // Gets the values from a user required to create a Fancy Sticky
{
    try
    {
        let hex_color;
        let title;
        let message;
        let media_url = null;
    
        // Get color
        msg.channel.send("Enter 'cancel' if you change your mind.");
        BotFunctions.SimpleMessage(msg.channel, "What hex color do you want? Example: #FFF68F (There are plenty of online tools to get that. Enter nocolor to use default.)", "What Color?", Colors["question"], sentMessage => {
            BotFunctions.WaitForUserResponse(msg.channel, msg.member, 300000, response => {
                if (response.content == "cancel")
                {
                    BotFunctions.SimpleMessage(msg.channel, CancelText, "Cancelled", Colors["success"]);
                    return;
                }
                
                hex_color = response.content != "nocolor" ? response.content : "#FFF043";
                
                try 
                {
                    resolveColor(hex_color)
                }
                catch (err)
                {
                    return BotFunctions.SimpleMessage(msg.channel, "The color you passed is not valid.", "Invalid color!", Colors["error"], _ => {
                        GetMessagePropertiesFromUser(msg, cb); // Restart process.
                    }); 
                }
                
                // Get title
                BotFunctions.SimpleMessage(msg.channel, "What should the title be? (Enter notitle to skip)", "What Title?", Colors["question"], sentMessage => {
                    BotFunctions.WaitForUserResponse(msg.channel, msg.member, 300000, response => {
                        BotFunctions.DeleteMessage(sentMessage);

                        if (response.content == "cancel")
                        {
                            BotFunctions.SimpleMessage(msg.channel, CancelText, "Cancelled", Colors["success"]);
                            return;
                        }
    
                        if (response.content != "notitle")
                            title = response.content;
    
                        // Get message
                        BotFunctions.SimpleMessage(msg.channel, "What should the message be?", "What Message?", Colors["question"], sentMessage => {
                            BotFunctions.WaitForUserResponse(msg.channel, msg.member, 600000, response => {
                                if (response.content == "cancel")
                                {
                                    BotFunctions.SimpleMessage(msg.channel, CancelText, "Cancelled", Colors["success"]);
                                    return;
                                }
                                            
                                BotFunctions.DeleteMessage(sentMessage);
                                message = response.content;
                                
                                // Check for attachments in the response
                                if (response.attachments && response.attachments.size > 0) {
                                    // Get the first attachment URL
                                    const attachment = response.attachments.first();
                                    media_url = attachment.url;
                                }
                                
                                // Ask for media if none was attached
                                if (!media_url) {
                                    BotFunctions.SimpleMessage(msg.channel, "Would you like to add an image/video/gif to this sticky? Reply with 'yes' to add media, or 'no' to skip.", "Add Media?", Colors["question"], sentMessage => {
                                        BotFunctions.WaitForUserResponse(msg.channel, msg.member, 300000, response => {
                                            BotFunctions.DeleteMessage(sentMessage);
                                            
                                            if (response.content.toLowerCase() === "yes") {
                                                BotFunctions.SimpleMessage(msg.channel, "Please upload your image, video, or GIF now. You can also paste a URL to the media.", "Upload Media", Colors["question"], sentMessage => {
                                                    BotFunctions.WaitForUserResponse(msg.channel, msg.member, 300000, response => {
                                                        BotFunctions.DeleteMessage(sentMessage);
                                                        
                                                        if (response.attachments && response.attachments.size > 0) {
                                                            // Get the first attachment URL
                                                            const attachment = response.attachments.first();
                                                            media_url = attachment.url;
                                                        } else if (response.content.match(/^https?:\/\/.+\.(jpeg|jpg|gif|png|mp4|webm|webp)$/i)) {
                                                            // If it's a URL to a media file
                                                            media_url = response.content;
                                                        }
                                                        
                                                        cb(hex_color, title, message, media_url);
                                                    });
                                                });
                                            } else {
                                                // No media, continue with the process
                                                cb(hex_color, title, message, null);
                                            }
                                        });
                                    });
                                } else {
                                    // Media was already attached to the message response
                                    cb(hex_color, title, message, media_url);
                                }
                            });          
                        });
                    });
                });
            });
        });
    }
    catch (error)
    {
        console.error(error);
    }
}

module.exports = {GetMessagePropertiesFromUser};
