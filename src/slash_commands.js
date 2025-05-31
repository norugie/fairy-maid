const { REST, Routes, SlashCommandBuilder } = require('discord.js');

// Import command handlers
const AddCommand = require("./commands/add.js");
const AddFancyCommand = require("./commands/addfancy.js");
const EditCommand = require("./commands/edit.js");
const RemoveCommand = require("./commands/remove.js");
const RemoveAllCommand = require("./commands/removeall.js");
const PreviewCommand = require("./commands/preview.js");
const PreviewFancyCommand = require("./commands/previewfancy.js");
const ListCommand = require("./commands/list.js");
const BotFunctions = require("./bot_functions.js");
const Colors = require("./messages/colors.js");

// Define slash commands
const commands = [
    // Sticky commands
    new SlashCommandBuilder()
        .setName('sticky')
        .setDescription('Manage sticky messages')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a sticky to a channel')
                .addChannelOption(option => 
                    option.setName('channel')
                        .setDescription('The channel to add the sticky to')
                        .setRequired(true))
                .addStringOption(option => 
                    option.setName('message')
                        .setDescription('The message to display in the sticky')
                        .setRequired(true))
                .addAttachmentOption(option => 
                    option.setName('media')
                        .setDescription('Optional media to include with the sticky')
                        .setRequired(false))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('addfancy')
                .setDescription('Add a fancy sticky to a channel')
                .addChannelOption(option => 
                    option.setName('channel')
                        .setDescription('The channel to add the fancy sticky to')
                        .setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Edit a sticky')
                .addChannelOption(option => 
                    option.setName('channel')
                        .setDescription('The channel containing the sticky')
                        .setRequired(true))
                .addIntegerOption(option => 
                    option.setName('id')
                        .setDescription('The ID of the sticky to edit')
                        .setRequired(true))
                .addStringOption(option => 
                    option.setName('message')
                        .setDescription('The new message for the sticky')
                        .setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a sticky')
                .addChannelOption(option => 
                    option.setName('channel')
                        .setDescription('The channel containing the sticky')
                        .setRequired(true))
                .addIntegerOption(option => 
                    option.setName('id')
                        .setDescription('The ID of the sticky to remove')
                        .setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('removeall')
                .setDescription('Remove all stickies from a channel')
                .addChannelOption(option => 
                    option.setName('channel')
                        .setDescription('The channel to remove all stickies from')
                        .setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('preview')
                .setDescription('Preview what a sticky looks like')
                .addStringOption(option => 
                    option.setName('message')
                        .setDescription('The message to preview')
                        .setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('previewfancy')
                .setDescription('Start the process of creating and previewing a fancy sticky')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List stickies in a channel or all channels with stickies')
                .addChannelOption(option => 
                    option.setName('channel')
                        .setDescription('The channel to list stickies from (optional)')
                        .setRequired(false))
        ),
    
    // Boost commands
    new SlashCommandBuilder()
        .setName('boost')
        .setDescription('Manage boost roles')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setroles')
                .setDescription('Set roles to remove when a user stops boosting')
                .addStringOption(option => 
                    option.setName('roleids')
                        .setDescription('Space-separated role IDs to remove when users stop boosting')
                        .setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('listroles')
                .setDescription('List roles that will be removed when a user stops boosting')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('clearroles')
                .setDescription('Clear all roles from boost management')
        )
];

// Function to register slash commands
async function registerCommands(client) {
    try {
        console.log('Started refreshing application (/) commands.');
        
        const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
        
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands.map(command => command.toJSON()) },
        );
        
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
}

// Function to handle slash command interactions
async function handleInteraction(interaction) {
    if (!interaction.isChatInputCommand()) return;
    
    // Always defer the reply immediately to prevent timeouts
    // But first check if it's already been deferred or replied to
    try {
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply();
        }
    } catch (error) {
        console.error("Error deferring interaction:", error);
        // Continue anyway, as the interaction might already be acknowledged
    }
    
    const { commandName, options } = interaction;
    
    // Check permissions for sticky commands
    if (commandName === 'sticky' && !interaction.member.permissions.has("ManageChannels")) {
        return interaction.editReply({
            embeds: [{
                title: "Insufficient Privileges!",
                description: "You need the 'Manage Channels' permission.",
                color: Colors["error"]
            }],
            ephemeral: true
        });
    }
    
    // Check permissions for boost commands
    if (commandName === 'boost' && !interaction.member.permissions.has("Administrator")) {
        return interaction.editReply({
            embeds: [{
                title: "Insufficient Privileges!",
                description: "You need the 'Administrator' permission to manage boost roles.",
                color: Colors["error"]
            }],
            ephemeral: true
        });
    }
    
    try {
        if (commandName === 'sticky') {
            const subcommand = options.getSubcommand();
            
            switch (subcommand) {
                case 'add': {
                    const channel = options.getChannel('channel');
                    const message = options.getString('message');
                    const attachment = options.getAttachment('media');
                    const mediaUrl = attachment ? attachment.url : null;
                    
                    // Create a mock message object for compatibility with existing code
                    const mockMsg = {
                        content: `!sticky add ${channel.id} ${message}`,
                        channel: interaction.channel,
                        guild: interaction.guild,
                        attachments: new Map()
                    };
                    
                    if (mediaUrl) {
                        mockMsg.attachments.set('0', { url: mediaUrl });
                    }
                    
                    // Use existing command handler with our mock message and flag that interaction is already deferred
                    AddCommand.Run(interaction.client, mockMsg, interaction, true);
                    break;
                }
                
                case 'addfancy': {
                    const channel = options.getChannel('channel');
                    
                    // Create a mock message object for compatibility
                    const mockMsg = {
                        content: `!sticky addfancy ${channel.id}`,
                        channel: interaction.channel,
                        guild: interaction.guild
                    };
                    
                    // Use existing command handler and flag that interaction is already deferred
                    AddFancyCommand.Run(interaction.client, mockMsg, interaction, true);
                    break;
                }
                
                case 'edit': {
                    const channel = options.getChannel('channel');
                    const id = options.getInteger('id');
                    const message = options.getString('message');
                    
                    // Create a mock message object for compatibility
                    const mockMsg = {
                        content: `!sticky edit ${channel.id} ${id} ${message}`,
                        channel: interaction.channel,
                        guild: interaction.guild
                    };
                    
                    // Use existing command handler and flag that interaction is already deferred
                    EditCommand.Run(interaction.client, mockMsg, interaction, true);
                    break;
                }
                
                case 'remove': {
                    const channel = options.getChannel('channel');
                    const id = options.getInteger('id');
                    
                    // Create a mock message object for compatibility
                    const mockMsg = {
                        content: `!sticky remove ${channel.id} ${id}`,
                        channel: interaction.channel,
                        guild: interaction.guild
                    };
                    
                    // Use existing command handler and flag that interaction is already deferred
                    RemoveCommand.Run(interaction.client, mockMsg, interaction, true);
                    break;
                }
                
                case 'removeall': {
                    const channel = options.getChannel('channel');
                    
                    // Create a mock message object for compatibility
                    const mockMsg = {
                        content: `!sticky removeall ${channel.id}`,
                        channel: interaction.channel,
                        guild: interaction.guild
                    };
                    
                    // Use existing command handler and flag that interaction is already deferred
                    RemoveAllCommand.Run(interaction.client, mockMsg, interaction, true);
                    break;
                }
                
                case 'preview': {
                    const message = options.getString('message');
                    
                    // Create a mock message object for compatibility
                    const mockMsg = {
                        content: `!sticky preview ${message}`,
                        channel: interaction.channel,
                        guild: interaction.guild
                    };
                    
                    // Use existing command handler and flag that interaction is already deferred
                    PreviewCommand.Run(interaction.client, mockMsg, interaction, true);
                    break;
                }
                
                case 'previewfancy': {
                    // Create a mock message object for compatibility
                    const mockMsg = {
                        content: `!sticky previewfancy`,
                        channel: interaction.channel,
                        guild: interaction.guild
                    };
                    
                    // Use existing command handler and flag that interaction is already deferred
                    PreviewFancyCommand.Run(interaction.client, mockMsg, interaction, true);
                    break;
                }
                
                case 'list': {
                    const channel = options.getChannel('channel');
                    
                    // Create a mock message object for compatibility
                    const mockMsg = {
                        content: channel ? `!sticky list ${channel.id}` : `!sticky list`,
                        channel: interaction.channel,
                        guild: interaction.guild
                    };
                    
                    // Use existing command handler and flag that interaction is already deferred
                    ListCommand.Run(interaction.client, mockMsg, interaction, true);
                    break;
                }
            }
        } else if (commandName === 'boost') {
            const subcommand = options.getSubcommand();
            
            switch (subcommand) {
                case 'setroles': {
                    const roleIdsStr = options.getString('roleids');
                    const roleIds = roleIdsStr.split(/\s+/);
                    
                    if (roleIds.length === 0) {
                        return interaction.editReply({
                            embeds: [{
                                title: "Missing Role IDs",
                                description: "Please provide at least one role ID to set as a boost role.",
                                color: Colors["error"]
                            }]
                        });
                    }
                    
                    global.boostManager.setBoostRoles(interaction.guild.id, roleIds);
                    
                    interaction.editReply({
                        embeds: [{
                            title: "Boost Roles Set",
                            description: `Successfully set ${roleIds.length} role(s) to be removed when users stop boosting.`,
                            color: Colors["success"]
                        }]
                    });
                    break;
                }
                
                case 'listroles': {
                    const configuredRoles = global.boostManager.getBoostRoles(interaction.guild.id);
                    
                    if (configuredRoles.length === 0) {
                        return interaction.editReply({
                            embeds: [{
                                title: "No Boost Roles",
                                description: "No roles are currently configured to be removed when users stop boosting.",
                                color: Colors["info"]
                            }]
                        });
                    }
                    
                    let roleList = "";
                    configuredRoles.forEach(roleId => {
                        const role = interaction.guild.roles.cache.get(roleId);
                        roleList += `• ${role ? role.name : "Unknown Role"} (${roleId})\n`;
                    });
                    
                    interaction.editReply({
                        embeds: [{
                            title: "Configured Boost Roles",
                            description: `The following roles will be removed when users stop boosting:\n\n${roleList}`,
                            color: Colors["info"]
                        }]
                    });
                    break;
                }
                
                case 'clearroles': {
                    global.boostManager.removeBoostRoles(interaction.guild.id);
                    
                    interaction.editReply({
                        embeds: [{
                            title: "Boost Roles Cleared",
                            description: "Successfully cleared all roles from boost management.",
                            color: Colors["success"]
                        }]
                    });
                    break;
                }
            }
        }
    } catch (error) {
        console.error(error);
        
        // If the interaction hasn't been replied to yet, send an error message
        if (!interaction.replied && !interaction.deferred) {
            interaction.reply({
                embeds: [{
                    title: "Error",
                    description: "An error occurred while processing your command.",
                    color: Colors["error"]
                }],
                ephemeral: true
            });
        } else if (interaction.deferred) {
            interaction.editReply({
                embeds: [{
                    title: "Error",
                    description: "An error occurred while processing your command.",
                    color: Colors["error"]
                }]
            });
        }
    }
}

module.exports = { registerCommands, handleInteraction };
