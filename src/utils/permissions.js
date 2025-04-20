const { PermissionsBitField } = require('discord.js');

module.exports = {
    hasModPermission: (interaction, requiredPermission) => {
        if (!interaction.member.permissions.has(requiredPermission)) {
            return {
                hasPermission: false,
                message: `❌ You need the ${requiredPermission} permission to use this command.`
            };
        }
        return { hasPermission: true };
    }
}; 