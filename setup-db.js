// Database setup script
const fs = require('fs');
const path = require('path');
// Load environment variables directly
require("dotenv").config();

// Get the database directory from environment or use default
const db_dir = process.env.DB_PATH || "./data";

// Create the database directory if it doesn't exist
console.log(`Setting up database directory at: ${db_dir}`);
if (!fs.existsSync(db_dir)) {
    try {
        fs.mkdirSync(db_dir, { recursive: true });
        console.log(`Created database directory: ${db_dir}`);
    } catch (error) {
        console.error(`Error creating database directory: ${error.message}`);
        process.exit(1);
    }
} else {
    console.log(`Database directory already exists: ${db_dir}`);
}

// Create an empty database file if it doesn't exist
const db_file = path.join(db_dir, 'bot.db');
if (!fs.existsSync(db_file)) {
    try {
        fs.writeFileSync(db_file, '');
        console.log(`Created empty database file: ${db_file}`);
    } catch (error) {
        console.error(`Error creating database file: ${error.message}`);
        process.exit(1);
    }
} else {
    console.log(`Database file already exists: ${db_file}`);
}

console.log('Database setup complete!');
