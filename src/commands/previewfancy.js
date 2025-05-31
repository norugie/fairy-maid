// Add Fancy command
const FancyFunctions = require("../messages/fancy_functions");
const BotFunctions = require("../bot_functions.js");

function Run(client, msg, interaction = null, isDeferred = false) {  
    if (interaction) {
        // For slash commands, we need to inform the user that this command requires interactive input
        interaction.editReply({
            embeds: [{
                title: "Interactive Command",
                description: "The fancy preview command requires interactive input. Please use the traditional command `!sticky previewfancy` instead.",
                color: 0xFFF68F // Default sticky color
            }]
        });
    } else {
        // Traditional command handling
        FancyFunctions.GetMessagePropertiesFromUser(msg, (hex_color, title, message) => {
            BotFunctions.SendStickyMessage(msg.channel, {
                "is_embed": true,
                "hex_color": hex_color,
                "title": title,
                "message": message
            });
        });
    }
}

module.exports = {Run};