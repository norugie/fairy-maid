// List command
const BotFunctions = require("../bot_functions.js");
const Errors = require("../messages/errors.js");
const Colors = require("../messages/colors.js");

const { EmbedBuilder } = require("discord.js");

function Run(client, msg, interaction = null, isDeferred = false) {
    let server_id, channel_id, subcommand;
    
    // Handle both traditional commands and slash commands
    if (interaction) {
        // This is a slash command interaction
        server_id = interaction.guild.id;
        
        // Get the subcommand (list or listall)
        subcommand = interaction.options.getSubcommand();
        
        // Get channel from options (optional for list command)
        const channel = interaction.options.getChannel('channel');
        channel_id = channel ? channel.id : null;
    } else {
        // This is a traditional prefix command
        server_id = msg.guild.id;
        const msgParams = BotFunctions.GetCommandParamaters(msg.content);
        channel_id = BotFunctions.GetMessageChannelID(msgParams[2]);
        // Default to 'list' for traditional commands
        subcommand = 'list';
    }
    
    // Handle listall subcommand
    if (interaction && subcommand === 'listall') {
        return handleListAllStickies(client, interaction, server_id);
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

// Function to handle the listall subcommand
async function handleListAllStickies(client, interaction, server_id) {
    // Get all stickies in the server using our new ListAllStickies method
    const allStickies = global.stickies.ListAllStickies(server_id);
    
    if (typeof(allStickies) === "string") {
        return interaction.editReply({
            embeds: [{
                title: "Error listing stickies",
                description: allStickies,
                color: Colors["error"]
            }]
        });
    }
    
    if (!allStickies || allStickies.length === 0) {
        return interaction.editReply({
            embeds: [{
                title: "No stickies found",
                description: Errors["no_stickies"],
                color: Colors["error"]
            }]
        });
    }
    
    // Create an embed to display all stickies
    const listEmbed = new EmbedBuilder()
        .setColor(Colors["info"])
        .setTitle(`All Stickies in ${interaction.guild.name}`);
    
    // Group stickies by channel for better organization
    const stickyByChannel = {};
    
    // First, group all stickies by channel
    for (const sticky of allStickies) {
        if (!stickyByChannel[sticky.channel_id]) {
            stickyByChannel[sticky.channel_id] = [];
        }
        stickyByChannel[sticky.channel_id].push(sticky);
    }
    
    // Now add each channel's stickies to the embed
    for (const [channelId, stickies] of Object.entries(stickyByChannel)) {
        try {
            // Fetch the channel to get its name
            const channel = await client.channels.fetch(channelId);
            const channelName = channel ? channel.name : 'Unknown Channel';
            
            // Create a field for each channel
            let fieldValue = '';
            
            stickies.forEach(sticky => {
                // Add sticky details to the field value
                let stickyInfo = `**#${sticky.sticky_id}**: `;
                
                if (sticky.title) {
                    stickyInfo += `*${sticky.title}* - `;
                }
                
                // Truncate message if it's too long
                const maxMessageLength = 50;
                const message = sticky.message.length > maxMessageLength ? 
                    `${sticky.message.substring(0, maxMessageLength)}...` : 
                    sticky.message;
                
                stickyInfo += message + '\n';
                
                // Add to field value if there's room
                if (fieldValue.length + stickyInfo.length < 1024) { // Discord field value limit
                    fieldValue += stickyInfo;
                }
            });
            
            // Add the field to the embed
            listEmbed.addFields({
                name: `#${channelName} (${stickies.length} ${stickies.length === 1 ? 'sticky' : 'stickies'})`,
                value: fieldValue || 'Error displaying stickies'
            });
        } catch (error) {
            console.error(`Error fetching channel ${channelId}:`, error);
        }
    }
    
    // Add a footer with the total count
    listEmbed.setFooter({ 
        text: `Total: ${allStickies.length} ${allStickies.length === 1 ? 'sticky' : 'stickies'} across ${Object.keys(stickyByChannel).length} ${Object.keys(stickyByChannel).length === 1 ? 'channel' : 'channels'}`
    });
    
    // Send the embed
    return interaction.editReply({ embeds: [listEmbed] });
}

module.exports = {Run};
