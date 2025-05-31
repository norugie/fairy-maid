// Memory manager - Handles conversation memory for the Fairy Maid
const sql = require("sqlite3").verbose();
const path = require('path');

class MemoryManager {
    constructor() {
        // In-memory conversation history
        this.conversationHistories = {};
        
        // Maximum number of messages to keep in memory per user
        this.maxHistoryLength = 10; // Reduced from 20 to save memory
        
        // Maximum number of users to keep in memory at once
        this.maxUserHistories = 25; // Limit to 25 users as requested
        
        // Track when histories were last accessed
        this.lastAccessed = {};
        
        // Database setup
        const db_dir = process.env.DB_PATH || "./";
        this.db_file = path.join(db_dir, 'bot.db');
        this.initDatabase();
        
        // Set up periodic cleanup to free memory
        setInterval(() => this.cleanupOldHistories(), 30 * 60 * 1000); // Run every 30 minutes
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
                    return;
                }
                
                // Create mentioned_users table if it doesn't exist
                this.db.run(`
                    CREATE TABLE IF NOT EXISTS mentioned_users (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id TEXT NOT NULL,
                        guild_id TEXT NOT NULL,
                        mentioned_user_id TEXT NOT NULL,
                        title TEXT NOT NULL,
                        specific_name TEXT NOT NULL,
                        timestamp INTEGER NOT NULL
                    )
                `, (error) => {
                    if (error) {
                        console.error(`Error creating mentioned_users table: ${error.message}`);
                    } else {
                        console.log('Memory database initialized successfully');
                    }
                });
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
        
        // Update last accessed time
        this.lastAccessed[key] = Date.now();
        
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
        
        // Check if we need to clean up some histories to stay under memory limit
        this.enforceUserLimit();
        
        return this.conversationHistories[key];
    }

    // Get conversation history for a user
    getHistory(userId, guildId) {
        const key = `${guildId}-${userId}`;
        
        // Update last accessed time if history exists
        if (this.conversationHistories[key]) {
            this.lastAccessed[key] = Date.now();
        }
        
        return this.conversationHistories[key] || [
            // Default system message if no history exists
            { role: 'system', content: 'You are the Fairy Maid of the Scarlet Devil Mansion.' }
        ];
    }

    // Remove least recently used histories when we exceed the maximum number of users
    enforceUserLimit() {
        const historyKeys = Object.keys(this.conversationHistories);
        
        if (historyKeys.length <= this.maxUserHistories) {
            return; // We're under the limit, no need to clean up
        }
        
        // Sort keys by last accessed time (oldest first)
        const sortedKeys = historyKeys.sort((a, b) => 
            (this.lastAccessed[a] || 0) - (this.lastAccessed[b] || 0)
        );
        
        // Remove oldest histories until we're under the limit
        const keysToRemove = sortedKeys.slice(0, historyKeys.length - this.maxUserHistories);
        
        keysToRemove.forEach(key => {
            delete this.conversationHistories[key];
            delete this.lastAccessed[key];
            console.log(`Removed conversation history for ${key} due to memory limits`);
        });
    }

    // Periodically clean up old conversation histories to free memory
    cleanupOldHistories() {
        const now = Date.now();
        const twoHoursAgo = now - (2 * 60 * 60 * 1000); // 2 hours in milliseconds
        
        let cleanupCount = 0;
        
        Object.keys(this.lastAccessed).forEach(key => {
            if (this.lastAccessed[key] < twoHoursAgo) {
                delete this.conversationHistories[key];
                delete this.lastAccessed[key];
                cleanupCount++;
            }
        });
        
        if (cleanupCount > 0) {
            console.log(`Memory cleanup: removed ${cleanupCount} inactive conversation histories`);
        }
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

    // Store a mentioned special user in the database
    storeMentionedUser(userId, guildId, mentionedUser) {
        if (!this.db) {
            console.error('Database not initialized');
            return;
        }
        
        const timestamp = Date.now();
        
        this.db.run(
            'INSERT INTO mentioned_users (user_id, guild_id, mentioned_user_id, title, specific_name, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, guildId, mentionedUser.id, mentionedUser.title, mentionedUser.specificName, timestamp],
            function(error) {
                if (error) {
                    console.error(`Error storing mentioned user: ${error.message}`);
                } else {
                    console.log(`Mentioned user ${mentionedUser.specificName} stored for user ${userId} with ID ${this.lastID}`);
                }
            }
        );
    }

    // Retrieve mentioned users for a user
    getMentionedUsers(userId, guildId, limit = 5) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }
            
            this.db.all(
                'SELECT mentioned_user_id, title, specific_name, timestamp FROM mentioned_users WHERE user_id = ? AND guild_id = ? ORDER BY timestamp DESC LIMIT ?',
                [userId, guildId, limit],
                (error, rows) => {
                    if (error) {
                        console.error(`Error retrieving mentioned users: ${error.message}`);
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
            const mentionedUsers = await this.getMentionedUsers(userId, guildId);
            
            if (memories.length === 0 && mentionedUsers.length === 0) {
                return null; // No memories to summarize
            }
            
            // Format memories into a readable summary
            let summary = "I remember:";
            
            // Add regular memories
            memories.forEach(memory => {
                const date = new Date(memory.timestamp);
                summary += `\n• ${memory.content} (${date.toLocaleDateString()})`;
            });
            
            // Add mentioned users if any
            if (mentionedUsers.length > 0) {
                summary += "\n\nSpecial users you've previously mentioned:";
                mentionedUsers.forEach(user => {
                    const date = new Date(user.timestamp);
                    summary += `\n• ${user.title} ${user.specific_name} (${date.toLocaleDateString()})`;
                });
            }
            
            return summary;
        } catch (error) {
            console.error(`Error generating memory summary: ${error.message}`);
            return null;
        }
    }
}

module.exports = { MemoryManager };
