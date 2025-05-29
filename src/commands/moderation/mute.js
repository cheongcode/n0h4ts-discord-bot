const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const {canModerateTarget} = require("../../utils/moderationPermissions");
const {performTimeout} = require("../../utils/moderationActions");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mute a user in the server')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to mute')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('duration')
                .setDescription('Mute duration in minutes (default: 5)')
                .setRequired(false))
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('Reason for the mute')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    
    async execute(interaction) {

        const targetUser = interaction.options.getUser('user');
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        // Get duration in minutes (default to 5 minutes if not specified)
        const durationMinutes = interaction.options.getInteger('duration') || 5;
        // Convert minutes to milliseconds (Discord API works with milliseconds)
        const durationMs = durationMinutes * 60 * 1000;

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
            // Add a defer reply to give more time for the timeout operation to complete
            await interaction.deferReply();

            // Discord uses timeouts to "mute" users
            const resultTimeout = await performTimeout(targetMember, durationMs, reason, interaction.user, interaction.guild);

            // Send confirmation message
            await interaction.editReply({
                content: `✅ ${targetUser} has been muted for ${durationMinutes} minute(s).\nReason: ${reason}`
            });

            if(resultTimeout.error){
                await interaction.followUp({
                    content: `:interrobang: ${resultTimeout.error}`,
                    ephemeral: true
                })
            }

        } catch (error) {
            console.error('Error while muting user:', error);

            // Provide a more detailed error message
            const errorMessage = error.message
                ? `❌ Error: ${error.message}`
                : '❌ An unknown error occurred while trying to mute the user.';

            // If we deferred earlier, we need to editReply instead of reply
            if (interaction.deferred) {
                return interaction.editReply({
                    content: errorMessage,
                    ephemeral: true
                });
            } else {
                return interaction.reply({
                    content: errorMessage,
                    ephemeral: true
                });
            }
        }
    }
};