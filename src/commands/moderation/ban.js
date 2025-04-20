const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { hasModPermission } = require('../../utils/permissions');
const { logModerationAction } = require('../../utils/moderationLogger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user from the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the ban')
                .setRequired(true)),

    async execute(interaction) {
        try {
            const permissionCheck = hasModPermission(interaction, PermissionsBitField.Flags.BanMembers);
            if (!permissionCheck.hasPermission) {
                return await interaction.reply({ content: permissionCheck.message, ephemeral: true });
            }

            const user = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason');
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);

            // Check if the user can be banned
            if (member && !member.bannable) {
                return await interaction.reply({ 
                    content: '❌ I cannot ban this user. They may have a higher role than me.',
                    ephemeral: true 
                });
            }

            await interaction.guild.members.ban(user, { reason });

            // Log the action
            await logModerationAction(interaction.client, {
                actionType: 'ban',
                user,
                moderator: interaction.user,
                reason,
                guild: interaction.guild,
                channel: interaction.channel
            });

            await interaction.reply({ 
                content: `🔨 Banned ${user.tag} for: ${reason}`,
                ephemeral: true 
            });
        } catch (error) {
            console.error('Error in ban command:', error);
            await interaction.reply({ 
                content: '❌ An error occurred while banning the user.',
                ephemeral: true 
            });
        }
    }
}; 