const { PermissionFlagsBits } = require('discord.js');

// canModerateTarget: Helps to check if current moderator meets the criteria to perform certain actions against another user
function canModerateTarget(source, targetMember, requiredBotPermission = PermissionFlagsBits.ModerateMembers, actionName) {
    const moderatorMember = source.member;
    const guild = source.guild;
    const botMember = guild.members.me;

    // Check if the target user exists in the server
    if (!targetMember) {
        return { canModerate: false, message: '❌ User not found in this server.' };
    }

    // Check if the bot has the general permission required for the action
    if (!botMember.permissions.has(requiredBotPermission)) {
        return { canModerate: false, message: `❌ I don't have permission to ${actionName} members.` };
    }

    // Check if target is moderatable by the bot
    if (!targetMember.moderatable) {
        return { canModerate: false, message: `❌ I cannot ${actionName} this user. They may have a higher role than me.` };
    }

    // CHeck if mod is an equal/higher role
    if (moderatorMember.id !== guild.ownerId && moderatorMember.roles.highest.position <= targetMember.roles.highest.position) {
        return { canModerate: false, message: `❌ You cannot ${actionName} someone with an equal or higher role than you.` };
    }

    return { canModerate: true, message: null };
}

module.exports = {
    canModerateTarget,
};
