const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { hasModPermission } = require('../../utils/permissions');
const { logModerationAction } = require('../../utils/moderationLogger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a user from the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to kick')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the kick')
                .setRequired(true)),

    async execute(interaction) {
        try {
            const permissionCheck = hasModPermission(interaction, PermissionsBitField.Flags.KickMembers);
            if (!permissionCheck.hasPermission) {
                return await interaction.reply({ content: permissionCheck.message, ephemeral: true });
            }

            const user = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason');
            const member = await interaction.guild.members.fetch(user.id);

            // Check if the user can be kicked
            if (!member.kickable) {
                return await interaction.reply({ 
                    content: '❌ I cannot kick this user. They may have a higher role than me.',
                    ephemeral: true 
                });
            }

            await member.kick(reason);

            // Log the action
            await logModerationAction(interaction.client, {
                actionType: 'kick',
                user,
                moderator: interaction.user,
                reason,
                guild: interaction.guild,
                channel: interaction.channel
            });

            await interaction.reply({ 
                content: `👢 Kicked ${user.tag} for: ${reason}`,
                ephemeral: true 
            });
        } catch (error) {
            console.error('Error in kick command:', error);
            await interaction.reply({ 
                content: '❌ An error occurred while kicking the user.',
                ephemeral: true 
            });
        }
    }
}; 