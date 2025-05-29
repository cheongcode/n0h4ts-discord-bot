const { SlashCommandBuilder, PermissionFlagsBits} = require('discord.js');
const { logModerationAction } = require('../../utils/moderationLogger');
const {canModerateTarget} = require("../../utils/moderationPermissions");

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
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {

        const targetUser = interaction.options.getUser('user');
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        const reason = interaction.options.getString('reason') || 'No reason provided';

        const moderationCheck = canModerateTarget(interaction, targetMember, PermissionFlagsBits.ModerateMembers, "warn");
        if (!moderationCheck.canModerate) {
            return interaction.reply({
                content: moderationCheck.message,
                ephemeral: true
            });
        }



        try {

            // Check if the user can be kicked
            if (!targetMember.kickable) {
                return await interaction.reply({ 
                    content: '❌ I cannot kick this user. They may have a higher role than me.',
                    ephemeral: true 
                });
            }

            await targetMember.kick(reason);

            // Log the action
            await logModerationAction(interaction.client, {
                actionType: 'kick',
                user: targetUser,
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