// Memory manager - Handles conversation memory for the Fairy Maid
const sql = require("sqlite3").verbose();
const path = require('path');

class MemoryManager {
    constructor() {
        // In-memory conversation history
        this.conversationHistories = {};
        
        // Maximum number of messages to keep in memory per user
        this.maxHistoryLength = 20;
        
        // Database setup
        const db_dir = process.env.DB_PATH || "./";
        this.db_file = path.join(db_dir, 'bot.db');
        this.initDatabase();
    }

    // Initialize the database and create tables if they don't exist
    initDatabase() {
        this.db = new sql.Database(this.db_file, (error) => {
            if (error) {
                console.error(`Error opening memory database: ${error.message}`);
                return;
            }
            
            // Create memories table if it doesn't exist
            this.db.run(`
                CREATE TABLE IF NOT EXISTS memories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    guild_id TEXT NOT NULL,
                    timestamp INTEGER NOT NULL,
                    content TEXT NOT NULL
                )
            `, (error) => {
                if (error) {
                    console.error(`Error creating memories table: ${error.message}`);
                } else {
                    console.log('Memory database initialized successfully');
                }
            });
        });
    }

    // Add a message to the conversation history for a user
    addToHistory(userId, guildId, role, content) {
        const key = `${guildId}-${userId}`;
        
        // Initialize history array if it doesn't exist
        if (!this.conversationHistories[key]) {
            this.conversationHistories[key] = [
                // System message is always kept as the first message
                { role: 'system', content: 'You are the Fairy Maid of the Scarlet Devil Mansion.' }
            ];
        }
        
        // Add the new message
        this.conversationHistories[key].push({ role, content });
        
        // Trim history to save tokens, but always keep the system message
        if (this.conversationHistories[key].length > this.maxHistoryLength) {
            this.conversationHistories[key] = [
                this.conversationHistories[key][0], // Keep system message
                ...this.conversationHistories[key].slice(-(this.maxHistoryLength - 1)) // Keep last N-1 messages
            ];
        }
        
        // If this is a user message, store it in the database for long-term memory
        if (role === 'user') {
            this.storeMemory(userId, guildId, content);
        }
        
        return this.conversationHistories[key];
    }

    // Get conversation history for a user
    getHistory(userId, guildId) {
        const key = `${guildId}-${userId}`;
        return this.conversationHistories[key] || [
            // Default system message if no history exists
            { role: 'system', content: 'You are the Fairy Maid of the Scarlet Devil Mansion.' }
        ];
    }

    // Store a memory in the database
    storeMemory(userId, guildId, content) {
        if (!this.db) {
            console.error('Database not initialized');
            return;
        }
        
        const timestamp = Date.now();
        
        this.db.run(
            'INSERT INTO memories (user_id, guild_id, timestamp, content) VALUES (?, ?, ?, ?)',
            [userId, guildId, timestamp, content],
            function(error) {
                if (error) {
                    console.error(`Error storing memory: ${error.message}`);
                } else {
                    console.log(`Memory stored for user ${userId} with ID ${this.lastID}`);
                }
            }
        );
    }

    // Retrieve memories for a user
    getMemories(userId, guildId, limit = 5) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }
            
            this.db.all(
                'SELECT content, timestamp FROM memories WHERE user_id = ? AND guild_id = ? ORDER BY timestamp DESC LIMIT ?',
                [userId, guildId, limit],
                (error, rows) => {
                    if (error) {
                        console.error(`Error retrieving memories: ${error.message}`);
                        reject(error);
                    } else {
                        resolve(rows);
                    }
                }
            );
        });
    }

    // Generate a memory summary for a user
    async getMemorySummary(userId, guildId) {
        try {
            const memories = await this.getMemories(userId, guildId);
            
            if (memories.length === 0) {
                return null; // No memories to summarize
            }
            
            // Format memories into a readable summary
            let summary = "I remember:";
            memories.forEach(memory => {
                const date = new Date(memory.timestamp);
                summary += `\n• ${memory.content} (${date.toLocaleDateString()})`;
            });
            
            return summary;
        } catch (error) {
            console.error(`Error generating memory summary: ${error.message}`);
            return null;
        }
    }
}

module.exports = { MemoryManager };
