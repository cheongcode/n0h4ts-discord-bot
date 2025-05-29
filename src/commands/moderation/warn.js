const { SlashCommandBuilder, PermissionFlagsBits} = require('discord.js');
const { logModerationAction } = require('../../utils/moderationLogger');
const fs = require('fs');
const path = require('path');
const {canModerateTarget} = require("../../utils/moderationPermissions");
const {performWarn} = require("../../utils/moderationActions");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a user for breaking rules')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to warn')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the warning')
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

            await interaction.deferReply({ephemeral: true});

            const warnResult = await performWarn(interaction.guild, targetMember, interaction.user, reason);

            await interaction.editReply({
                content: `⚠️ Warned ${targetUser} for: ${reason}.}`,
                ephemeral: true
            });

            if(warnResult.autoTimedOut){
                await interaction.followUp({
                    content: `⚠️ ${targetUser} has received 3 warnings and has been timed out for 10 minutes.`,
                    ephemeral: true
                })
            }

            if(warnResult.error){
                await interaction.followUp({
                    content: `:interrobang: ${warnResult.error}`,
                    ephemeral: true
                })
            }

            await logModerationAction(interaction.client, {
                actionType: 'warn',
                user: targetUser,
                moderator: interaction.user,
                reason,
                guild: interaction.guild,
                channel: interaction.channel
            });



        } catch (error) {
            console.error('Error in warn command:', error);
            await interaction.reply({ 
                content: '❌ An error occurred while warning the user.',
                ephemeral: true 
            });
        }
    }
}; 