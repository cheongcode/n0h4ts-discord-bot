const { SlashCommandBuilder, PermissionsBitField, PermissionFlagsBits} = require('discord.js');
const { hasModPermission } = require('../../utils/permissions');
const { logModerationAction } = require('../../utils/moderationLogger');
const {performBan} = require("../../utils/moderationActions");
const {canModerateTarget} = require("../../utils/moderationPermissions");

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
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {


        const targetUser = interaction.options.getUser('user');
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        const reason = interaction.options.getString('reason') || 'No reason provided';

        const moderationCheck = canModerateTarget(interaction, targetMember, PermissionFlagsBits.ModerateMembers, "ban");
        if (!moderationCheck.canModerate) {
            return interaction.reply({
                content: moderationCheck.message,
                ephemeral: true
            });
        }

        // Check if the user can be banned
        if (targetMember && !targetMember.bannable) {
            return await interaction.reply({
                content: '❌ I cannot ban this user. They may have a higher role than me.',
                ephemeral: true
            });
        }

        try {



            const banResult = await performBan(targetMember, reason, interaction.user, interaction.guild);

            await interaction.guild.members.ban(targetUser, { reason });

            // Log the action
            await logModerationAction(interaction.client, {
                actionType: 'ban',
                user: targetUser,
                moderator: interaction.user,
                reason,
                guild: interaction.guild,
                channel: interaction.channel
            });

            await interaction.reply({ 
                content: `🔨 Banned ${targetUser} for: ${reason}`,
                ephemeral: true 
            });

            if(banResult.error){
                await interaction.followUp({
                    content: `:interrobang: ${banResult.error}`,
                    ephemeral: true
                })
            }


        } catch (error) {
            console.error('Error in ban command:', error);
            await interaction.reply({ 
                content: '❌ An error occurred while banning the user.',
                ephemeral: true 
            });
        }
    }
}; 