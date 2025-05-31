const { REST, Routes } = require('discord.js');
// Load environment variables directly
require("dotenv").config();
const { registerCommands } = require('./src/slash_commands.js');

// Create a REST instance
const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

// Function to deploy commands
async function deployCommands() {
    try {
        console.log('Started refreshing application (/) commands.');
        
        // Get the client ID from the environment
        const clientId = process.env.CLIENT_ID;
        
        if (!clientId) {
            console.error('CLIENT_ID not found in environment variables. Please add it to your .env file.');
            process.exit(1);
        }
        
        // Create a mock client object with the necessary properties
        const mockClient = {
            user: {
                id: clientId
            }
        };
        
        // Register commands using the mock client
        await registerCommands(mockClient);
        
        console.log('Successfully registered application (/) commands.');
    } catch (error) {
        console.error(error);
    }
}

// Run the deployment
deployCommands();
