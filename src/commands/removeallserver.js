// Remove all server stickies command
const BotFunctions = require("../bot_functions.js");
const Errors = require("../messages/errors.js");
const Colors = require("../messages/colors.js");

function Run(client, msg, interaction = null, isDeferred = false) {
    let server_id;
    
    // Handle both traditional commands and slash commands
    if (interaction) {
        // This is a slash command interaction
        server_id = interaction.guild.id;
    } else {
        // This is a traditional prefix command
        server_id = msg.guild.id;
    }
    
    // Check if the user has permission to manage messages
    const hasPermission = interaction ? 
        interaction.member.permissions.has("MANAGE_MESSAGES") : 
        msg.member.permissions.has("MANAGE_MESSAGES");
    
    if (!hasPermission) {
        const errorMessage = "You need the 'Manage Messages' permission to remove all stickies from the server.";
        
        if (interaction) {
            return interaction.editReply({
                embeds: [{
                    title: "Permission Error",
                    description: errorMessage,
                    color: Colors["error"]
                }]
            });
        } else {
            return BotFunctions.SimpleMessage(msg.channel, errorMessage, "Permission Error", Colors["error"]);
        }
    }
    
    // Confirm with the user before proceeding
    if (interaction) {
        // For slash commands, we'll use a follow-up message for confirmation
        interaction.editReply({
            embeds: [{
                title: "⚠️ Warning: Remove All Stickies",
                description: "This will remove **ALL** stickies from the entire server. This action cannot be undone.\n\nPlease confirm by replying with 'confirm' within 30 seconds.",
                color: Colors["warning"]
            }]
        });
        
        // Create a message collector to wait for confirmation
        const filter = m => m.author.id === interaction.user.id && m.content.toLowerCase() === 'confirm';
        const collector = interaction.channel.createMessageCollector({ filter, time: 30000, max: 1 });
        
        collector.on('collect', () => {
            // User confirmed, proceed with deletion
            global.stickies.RemoveAllServerStickies(server_id, (success, count) => {
                if (success) {
                    interaction.followUp({
                        embeds: [{
                            title: "All Stickies Removed",
                            description: `Successfully removed ${count} ${count === 1 ? 'sticky' : 'stickies'} from the server.`,
                            color: Colors["success"]
                        }]
                    });
                } else {
                    interaction.followUp({
                        embeds: [{
                            title: "Error",
                            description: typeof success === 'string' ? success : "Failed to remove all stickies from the server.",
                            color: Colors["error"]
                        }]
                    });
                }
            });
        });
        
        collector.on('end', collected => {
            if (collected.size === 0) {
                // User didn't confirm in time
                interaction.followUp({
                    embeds: [{
                        title: "Operation Cancelled",
                        description: "You didn't confirm in time. No stickies were removed.",
                        color: Colors["info"]
                    }]
                });
            }
        });
    } else {
        // For traditional commands, we'll use a direct message for confirmation
        BotFunctions.SimpleMessage(msg.channel, "This will remove **ALL** stickies from the entire server. This action cannot be undone.\n\nPlease confirm by replying with 'confirm' within 30 seconds.", "⚠️ Warning: Remove All Stickies", Colors["warning"]);
        
        // Create a message collector to wait for confirmation
        const filter = m => m.author.id === msg.author.id && m.content.toLowerCase() === 'confirm';
        const collector = msg.channel.createMessageCollector({ filter, time: 30000, max: 1 });
        
        collector.on('collect', () => {
            // User confirmed, proceed with deletion
            global.stickies.RemoveAllServerStickies(server_id, (success, count) => {
                if (success) {
                    BotFunctions.SimpleMessage(msg.channel, `Successfully removed ${count} ${count === 1 ? 'sticky' : 'stickies'} from the server.`, "All Stickies Removed", Colors["success"]);
                } else {
                    BotFunctions.SimpleMessage(msg.channel, typeof success === 'string' ? success : "Failed to remove all stickies from the server.", "Error", Colors["error"]);
                }
            });
        });
        
        collector.on('end', collected => {
            if (collected.size === 0) {
                // User didn't confirm in time
                BotFunctions.SimpleMessage(msg.channel, "You didn't confirm in time. No stickies were removed.", "Operation Cancelled", Colors["info"]);
            }
        });
    }
}

module.exports = {Run};
