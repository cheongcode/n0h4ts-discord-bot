const { SlashCommandBuilder, PermissionsBitField, PermissionFlagsBits} = require('discord.js');
const { hasModPermission } = require('../../utils/permissions');
const { logModerationAction } = require('../../utils/moderationLogger');
const {canModerateTarget} = require("../../utils/moderationPermissions");
const {performTimeout} = require("../../utils/moderationActions");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to timeout')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Duration (e.g., 30m, 1h, 24h)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the timeout')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {

        const targetUser = interaction.options.getUser('user');
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        const duration = interaction.options.getString('duration') || "5m";

        // Get reason (or use default)
        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Validation check including perms
        const moderationCheck = canModerateTarget(interaction, targetMember, PermissionFlagsBits.ModerateMembers, "mute");
        if (!moderationCheck.canModerate) {
            return interaction.reply({
                content: moderationCheck.message,
                ephemeral: true
            });
        }

        try {


            // Parse duration
            const durationMatch = duration.match(/^(\d+)([mhd])$/);

            if (!durationMatch) {
                return await interaction.reply({ 
                    content: '❌ Invalid duration format. Use formats like 30m, 1h, 24h',
                    ephemeral: true 
                });
            }

            const [, amount, unit] = durationMatch;
            let durationInMs;

            switch (unit) {
                case 'm':
                    durationInMs = parseInt(amount) * 60 * 1000;
                    break;
                case 'h':
                    durationInMs = parseInt(amount) * 60 * 60 * 1000;
                    break;
                case 'd':
                    durationInMs = parseInt(amount) * 24 * 60 * 60 * 1000;
                    break;
            }

            // Maximum timeout is 28 days
            if (durationInMs > 28 * 24 * 60 * 60 * 1000) {
                return await interaction.reply({ 
                    content: '❌ Maximum timeout duration is 28 days',
                    ephemeral: true 
                });
            }


            // Discord uses timeouts to "mute" users
            const resultTimeout = await performTimeout(targetMember, durationInMs, reason, interaction.user, interaction.guild);


            // Log the action
            await logModerationAction(interaction.client, {
                actionType: 'timeout',
                user: targetUser,
                moderator: interaction.user,
                reason,
                guild: interaction.guild,
                channel: interaction.channel,
                duration: duration
            });

            await interaction.reply({ 
                content: `⏰ Timed out ${targetUser} for ${duration} for: ${reason}`,
                ephemeral: true 
            });

            if(resultTimeout.error){
                await interaction.followUp({
                    content: `:interrobang: ${resultTimeout.error}`,
                    ephemeral: true
                })
            }

        } catch (error) {
            console.error('Error in timeout command:', error);
            await interaction.reply({ 
                content: '❌ An error occurred while timing out the user.',
                ephemeral: true 
            });
        }
    }
}; 