// List command
const BotFunctions = require("../bot_functions.js");
const Errors = require("../messages/errors.js");
const Colors = require("../messages/colors.js");

const { EmbedBuilder } = require("discord.js");

function Run(client, msg, interaction = null, isDeferred = false) {
    let server_id, channel_id;
    
    // Handle both traditional commands and slash commands
    if (interaction) {
        // This is a slash command interaction
        server_id = interaction.guild.id;
        
        // Get channel from options (optional for list command)
        const channel = interaction.options.getChannel('channel');
        channel_id = channel ? channel.id : null;
    } else {
        // This is a traditional prefix command
        server_id = msg.guild.id;
        const msgParams = BotFunctions.GetCommandParamaters(msg.content);
        channel_id = BotFunctions.GetMessageChannelID(msgParams[2]);
    }

    // They want to list all channel stickies 
    if (channel_id == null || channel_id.length <= 0)
    {
        const stickyList = global.stickies.GetStickies(server_id, null);
        if (typeof(stickyList) == "string") {
            if (interaction) {
                interaction.editReply({
                    embeds: [{
                        title: "Error listing stickies",
                        description: stickyList,
                        color: Colors["error"]
                    }]
                });
                return;
            }
            return BotFunctions.SimpleMessage(msg.channel, stickyList, "Error listing stickies", Colors["error"]);
        }

        const listEmbed = new EmbedBuilder();
        listEmbed.setColor(Colors["info"]);
        listEmbed.title = global.discordApplication.name;

        if (stickyList != null && stickyList != false)
        {
            let bStickiesExist = false;
            let iChannelsWithStickies = 0;
            let szChannelList = "";
            stickyList.forEach((val, index, array) => {
                bStickiesExist = true;
                client.channels.fetch(val["server_id"]).then(channel => {
                    if (val.count > 0)
                    {
                        szChannelList = "";
                        szChannelList += `
                            ${channel.toString()}
                            Count: ${val.count}
                        `;

                        listEmbed.addFields({name: "Stickies", value: szChannelList});  
                        iChannelsWithStickies++;
                    }
                    else 
                        bEmbedHasFields = false;

                    if (array.length - 1 == index)
                    {
                        if (iChannelsWithStickies <= 0) {
                            if (interaction) {
                                interaction.editReply({
                                    embeds: [{
                                        title: "Error listing stickies",
                                        description: Errors["no_stickies"],
                                        color: Colors["error"]
                                    }]
                                });
                            } else {
                                BotFunctions.SimpleMessage(msg.channel, Errors["no_stickies"], "Error listing stickies", Colors["error"]);
                            }
                        } else {
                            if (interaction) {
                                interaction.editReply({ embeds: [listEmbed] });
                            } else {
                                msg.channel.send({embeds: [listEmbed]});
                            }
                        }
                    }
                }).catch(err => {
                    console.error(err);
                });
            });

            if (!bStickiesExist) {
                if (interaction) {
                    interaction.editReply({
                        embeds: [{
                            title: "Error listing stickies",
                            description: Errors["no_stickies"],
                            color: Colors["error"]
                        }]
                    });
                } else {
                    BotFunctions.SimpleMessage(msg.channel, Errors["no_stickies"], "Error listing stickies", Colors["error"]);
                }
            }
        }
        else {
            if (interaction) {
                interaction.editReply({
                    embeds: [{
                        title: "Error listing stickies",
                        description: Errors["no_stickies"],
                        color: Colors["error"]
                    }]
                });
            } else {
                BotFunctions.SimpleMessage(msg.channel, Errors["no_stickies"], "Error listing stickies", Colors["error"]);
            }
        }
    
        return;
    }
    
    // They want to list a specific channel's stickies
    client.channels.fetch(channel_id).then(channel => {
        if (interaction) {
            // For slash commands, we need to handle the response differently
            const stickies = global.stickies.GetStickies(server_id, channel_id);
            
            if (typeof(stickies) === "string") {
                interaction.editReply({
                    embeds: [{
                        title: "Error listing stickies",
                        description: stickies,
                        color: Colors["error"]
                    }]
                });
                return;
            }
            
            if (!stickies || stickies.length === 0) {
                interaction.editReply({
                    embeds: [{
                        title: "Error listing stickies",
                        description: Errors["no_stickies"],
                        color: Colors["error"]
                    }]
                });
                return;
            }
            
            const listEmbed = new EmbedBuilder()
                .setColor(Colors["info"])
                .setTitle(`Stickies in ${channel.name}`);
                
            stickies.forEach((sticky, index) => {
                const fieldTitle = `Sticky #${index + 1}`;
                let fieldValue = sticky.message;
                
                if (sticky.title) {
                    fieldValue = `**${sticky.title}**\n${fieldValue}`;
                }
                
                if (sticky.media_url) {
                    fieldValue += "\n[Media Attached]";
                }
                
                listEmbed.addFields({
                    name: fieldTitle,
                    value: fieldValue.substring(0, 1024) // Discord field value limit
                });
            });
            
            interaction.editReply({ embeds: [listEmbed] });
        } else {
            // Traditional command handling
            BotFunctions.ListChannelStickies(server_id, channel, msg.channel);
        }
    }).catch(_ => {
        if (channel_id != null) {
            if (interaction) {
                interaction.editReply({
                    embeds: [{
                        title: "Error getting channel ID",
                        description: Errors["invalid_channel"],
                        color: Colors["error"]
                    }]
                });
            } else {
                return BotFunctions.SimpleMessage(msg.channel, Errors["invalid_channel"], "Error getting channel ID", Colors["error"]);
            }
        }
    }); 
}

module.exports = {Run};
