const Errors = require("./messages/errors.js");
const Colors = require("./messages/colors.js");
const STICKY_COOLDOWN = isNaN(parseInt(process.env.STICKY_COOLDOWN)) ? 20000 : process.env.STICKY_COOLDOWN; 

const { EmbedBuilder, resolveColor } = require("discord.js");

var exported = {
    DeleteMessage: function(message, cb)
    {
        if (message == null || typeof message.delete !== "function" || message.deleted)
            return;
        
        try 
        {
            message.delete().then(_ => {
                if (typeof cb === "function")
                    cb(message);
            }).catch(err => {
                console.error(`Error during message deletion: ${err}`);
            });
        }
        catch (err) {
            console.error(`Error deleting message: ${err}`);
        }
    },

    SimpleMessage: function(channel, message, title, color, cb)
    {   
        try
        {
            const embed = new EmbedBuilder();

            if (color != null)
                embed.setColor(color);
            
            if (title != null)
                embed.setTitle(title);

            // Stupid workaround thanks to discord.js not supporting more than 1 single space inside embeds
            const fake_space = " ឵឵  ឵឵";
            const discordjs_not_doing_its_job = message.replace(/([^\S\r\n][^\S\r\n])/gm, fake_space);
       
            embed.setDescription(discordjs_not_doing_its_job); 
            
            // Check if this is an interaction reply or a regular channel
            if (channel.isRepliable && typeof channel.reply === 'function') {
                // This is an interaction
                if (channel.replied || channel.deferred) {
                    channel.editReply({embeds: [embed]}).then(sentMessage => {
                        if (typeof(cb) == "function") 
                            cb(sentMessage);
                    }).catch(err => {                    
                        console.error(`Failed to edit interaction reply: ${err}`);
                    });
                } else {
                    channel.reply({embeds: [embed]}).then(sentMessage => {
                        if (typeof(cb) == "function") 
                            cb(sentMessage);
                    }).catch(err => {                    
                        console.error(`Failed to reply to interaction: ${err}`);
                    });
                }
            } else {
                // This is a regular channel
                channel.send({embeds: [embed]}).then(sentMessage => {
                    if (typeof(cb) == "function") 
                        cb(sentMessage);
                }).catch(err => {                    
                    console.error(`Failed to create a Simple Message: ${err}`);
                });
            }
        }
        catch(err)
        {
            console.error(`Failed to create a Simple Message: ${err}`);
        }
    },

    WaitForUserResponse: function(channel, user, time, cb) // Wait for specific user to respond in specified channel, send result to callback
    {
        try 
        {
            const collector = channel.createMessageCollector((m) => m.member == user, {time: time}).on("collect", (response) => {
                if (typeof cb === "function")
                    cb(response);
            
                collector.stop();
            });
        }
        catch (err)
        {
            console.error(`Failed to create Message Collector': ${err}`);
        }
    },

    GetMessageChannelID: function(message)
    {
        if (typeof message !== "string") return "";
        return message.replace("#", "").replace("<", "").replace(">", "");
    },

    GetCommandParamaters: function(command)
    {
        return typeof command !== "string" ? [""] : command.toLowerCase().split(" ").filter(i => i);
    },
   
    GetStickyCooldown: function()
    {
        return STICKY_COOLDOWN;
    },
    
    SendStickyMessage: function(channel, sticky, cb)
    {
        // Prepare message options
        const messageOptions = {};
        
        // If there's a media URL, add it to the message options
        if (sticky["media_url"]) {
            messageOptions.files = [sticky["media_url"]];
        }
        
        if (sticky["is_embed"])
        {
            // For embeds with media, we need to handle differently
            if (sticky["media_url"]) {
                const embed = new EmbedBuilder();
                
                if (sticky["hex_color"])
                    embed.setColor(sticky["hex_color"]);
                    
                if (sticky["title"])
                    embed.setTitle(sticky["title"]);
                    
                // Stupid workaround thanks to discord.js not supporting more than 1 single space inside embeds
                const fake_space = " ឵឵  ឵឵";
                const discordjs_not_doing_its_job = sticky["message"].replace(/([^\S\r\n][^\S\r\n])/gm, fake_space);
                
                embed.setDescription(discordjs_not_doing_its_job);
                
                // Set the image in the embed if it's an image URL
                if (sticky["media_url"].match(/\.(jpeg|jpg|gif|png)$/i)) {
                    embed.setImage(sticky["media_url"]);
                    // Remove from files since we're using it in the embed
                    delete messageOptions.files;
                }
                
                messageOptions.embeds = [embed];
                
                channel.send(messageOptions).then(sentMessage => {
                    if (typeof cb == "function")
                        cb(sentMessage);
                }).catch(err => {
                    console.error(`Failed to send sticky message with media: ${err}`);
                });
            } else {
                // Regular embed without media
                this.SimpleMessage(channel, sticky["message"], sticky["title"], sticky["hex_color"], sentMessage => {
                    if (typeof cb == "function")
                        cb(sentMessage);
                });
            }
        }
        else
        {
            // For regular messages, add the text content
            messageOptions.content = sticky["message"];
            
            channel.send(messageOptions).then(sentMessage => {
                sentMessage.suppressEmbeds(true);

                if (typeof cb === "function")
                    cb(sentMessage);
            }).catch(err => {                        
                console.error(`Failed to send sticky message: ${err}`);
            });
        }
    },

    UpdateLastStickyTime: function(channel, time)
    {
        if (channel != null)
        {
            if (time == null) time = Date.now();
            channel.lastStickyTime = time;
        }
    },

    ResetLastStickyTime: function(channel)
    {
        if (channel != null)
            channel.lastStickyTime = STICKY_COOLDOWN;
    },
    
    GetLastStickyTime: function(channel)
    {
        if (channel != null)
        {
            if (channel.lastStickyTime == null)
                this.ResetLastStickyTime(channel);

            return Date.now() - channel.lastStickyTime;
        }
    },

    GetLastStickyMessages: function(channel) 
    {
        if (!Array.isArray(channel.lastStickyMessages))
            channel.lastStickyMessages = new Array();
        
        return channel.lastStickyMessages;
    },
    
    DeleteLastStickyMessages: function(channel)
    {
        if (channel == null || !Array.isArray(channel.lastStickyMessages))
            return;
        
        channel.lastStickyMessages.forEach((msg) => {
            if (msg == null) return;
            this.DeleteMessage(msg, _ => {
                // Now that it's officially deleted, we can remove it from the array 
                channel.lastStickyMessages = channel.lastStickyMessages.filter(element => { return element !== msg; });
            });
        });
    },
    
    ShowChannelStickies: function(server_id, channel)
    { 
        if (!global.stickies.ValidStickyChannel(server_id, channel.id))
            return; 
        if (this.GetLastStickyTime(channel) < this.GetStickyCooldown()) // Wait a bit, we don't wanna interrupt conversations
            return this.UpdateLastStickyTime(channel);  
        
        this.DeleteLastStickyMessages(channel);
        
        const stickyList = global.stickies.GetStickies(server_id, channel.id);
        if (!Array.isArray(stickyList))
            return;

        stickyList.forEach((val, index, _) => {
            this.UpdateLastStickyTime(channel); 
            
            this.SendStickyMessage(channel, val, (sentMessage) => {
                this.UpdateLastStickyTime(channel); // Update again, because sometimes stickies can take a while to appear (API rate limits)
                this.GetLastStickyMessages(channel).push(sentMessage);
            });
        });
    },

    ListChannelStickies: function (server_id, channel, info_channel)
    { 
        if (!global.stickies.ValidStickyChannel(server_id, channel.id))
            return this.SimpleMessage(info_channel, Errors["no_stickies_channel"], "Error listing stickies", Colors["error"]);
    
        const stickyList = global.stickies.GetStickies(server_id, channel.id);
        if (!Array.isArray(stickyList))
            return;
        if (stickyList.length <= 0) 
            return this.SimpleMessage(info_channel, Errors["no_stickies_channel"], "Error listing stickies", Colors["error"]);
            
        stickyList.forEach((val, index, _) => { 
            const cpVal = Object.assign({}, val); // Make a copy, otherwise our edits below will change the actual stickies
            cpVal.is_embed = true;
            cpVal.title = `Sticky #${index + 1} ${cpVal.title != null ? cpVal.title : ""}`;  
            this.SendStickyMessage(info_channel, cpVal);
        });
    }
};

module.exports = exported;
