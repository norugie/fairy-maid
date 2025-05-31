// Preview command
const BotFunctions = require("../bot_functions.js");
const Colors = require("../messages/colors.js");

function Run(client, msg, interaction = null, isDeferred = false) {
    let server_id, input_message;
    
    // Handle both traditional commands and slash commands
    if (interaction) {
        // This is a slash command interaction
        server_id = interaction.guild.id;
        
        // Get message from options
        input_message = interaction.options.getString('message');
    } else {
        // This is a traditional prefix command
        const msgParams = BotFunctions.GetCommandParamaters(msg.content);
        server_id = msg.guild.id;
        input_message = msgParams[2];
    }

    if (input_message != null) {
        if (interaction) {
            // For slash commands, send the preview in the channel and also acknowledge the interaction
            interaction.channel.send(input_message).then(sentMessage => {
                sentMessage.suppressEmbeds(true);
                
                // Acknowledge the interaction
                interaction.editReply({
                    embeds: [{
                        title: "Preview Sent",
                        description: "Preview message has been sent in this channel.",
                        color: Colors["success"]
                    }]
                });
            }).catch(err => {
                console.error(`Error previewing message: ${err}`);
                
                // Report the error
                interaction.editReply({
                    embeds: [{
                        title: "Error Previewing Message",
                        description: `There was an error sending the preview: ${err.message}`,
                        color: Colors["error"]
                    }]
                });
            });
        } else {
            // Traditional command handling
            const originalMsg = msg.content.replace(msgParams[0], "").replace(msgParams[1], "");
                
            msg.channel.send(originalMsg).then(sentMessage => {
                sentMessage.suppressEmbeds(true);
            }).catch(err => {
                console.error(`Error previewing message: ${err}`);
            });
        }
    } else {
        if (interaction) {
            interaction.editReply({
                embeds: [{
                    title: "Empty Message!",
                    description: "You entered nothing.",
                    color: Colors["error"]
                }]
            });
        } else {
            BotFunctions.SimpleMessage(msg.channel, "You entered nothing.", "Empty message!", Colors["error"]);
        }
    }
}   

module.exports = {Run};
