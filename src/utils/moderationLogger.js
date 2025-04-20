const fs = require('fs');
const path = require('path');

module.exports = {
    logModerationAction: async (client, actionObject) => {
        const { actionType, user, moderator, reason, guild, channel, duration } = actionObject;
        
        // Format the log message
        const logMessage = `[${new Date().toISOString()}] ${actionType.toUpperCase()}\n` +
            `User: ${user.tag} (${user.id})\n` +
            `Moderator: ${moderator.tag} (${moderator.id})\n` +
            `Reason: ${reason}\n` +
            (duration ? `Duration: ${duration}\n` : '') +
            `Channel: ${channel.name}\n` +
            `Guild: ${guild.name}\n` +
            '-------------------\n';

        // Try to find mod-log channel
        const modLogChannel = guild.channels.cache.find(
            c => c.name === 'mod-log' && c.type === 0 // Text channel
        );

        if (modLogChannel) {
            try {
                await modLogChannel.send(`\`\`\`\n${logMessage}\`\`\``);
            } catch (error) {
                console.error('Error sending to mod-log channel:', error);
            }
        }

        // Always log to console
        console.log(logMessage);
    }
}; 