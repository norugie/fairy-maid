// Boost manager - Handles role management for server boosters
const fs = require('fs');
const path = require('path');

class BoostManager {
    constructor() {
        this.boostRoleConfig = {};
        this.configPath = './boost_config.json';
        this.loadConfig();
    }

    // Load configuration from file
    loadConfig() {
        try {
            if (fs.existsSync(this.configPath)) {
                const configData = fs.readFileSync(this.configPath, 'utf8');
                this.boostRoleConfig = JSON.parse(configData);
                console.log('Boost role configuration loaded successfully');
            } else {
                // Create default config if none exists
                this.boostRoleConfig = {};
                this.saveConfig();
                console.log('Created new boost role configuration file');
            }
        } catch (error) {
            console.error(`Error loading boost configuration: ${error.message}`);
            this.boostRoleConfig = {};
        }
    }

    // Save configuration to file
    saveConfig() {
        try {
            fs.writeFileSync(this.configPath, JSON.stringify(this.boostRoleConfig, null, 2), 'utf8');
            console.log('Boost role configuration saved successfully');
        } catch (error) {
            console.error(`Error saving boost configuration: ${error.message}`);
        }
    }

    // Set roles to be removed when a user stops boosting
    setBoostRoles(serverId, roleIds) {
        if (!Array.isArray(roleIds)) {
            roleIds = [roleIds]; // Convert single role ID to array
        }
        
        this.boostRoleConfig[serverId] = roleIds;
        this.saveConfig();
        return true;
    }

    // Get roles configured to be removed for a server
    getBoostRoles(serverId) {
        return this.boostRoleConfig[serverId] || [];
    }

    // Remove roles from a server's configuration
    removeBoostRoles(serverId) {
        if (this.boostRoleConfig[serverId]) {
            delete this.boostRoleConfig[serverId];
            this.saveConfig();
            return true;
        }
        return false;
    }

    // Handle when a user stops boosting
    handleBoostRemoved(member) {
        const serverId = member.guild.id;
        const rolesToRemove = this.getBoostRoles(serverId);
        
        if (rolesToRemove.length === 0) {
            return false; // No roles configured to remove
        }
        
        let rolesRemoved = 0;
        
        // Remove each configured role from the member
        rolesToRemove.forEach(roleId => {
            if (member.roles.cache.has(roleId)) {
                member.roles.remove(roleId)
                    .then(() => {
                        console.log(`Removed role ${roleId} from ${member.user.tag} (${member.id}) as they stopped boosting`);
                        rolesRemoved++;
                    })
                    .catch(error => {
                        console.error(`Failed to remove role ${roleId} from ${member.user.tag}: ${error.message}`);
                    });
            }
        });
        
        return rolesRemoved > 0;
    }
}

module.exports = { BoostManager };
