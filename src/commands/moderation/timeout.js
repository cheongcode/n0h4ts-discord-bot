const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { hasModPermission } = require('../../utils/permissions');
const { logModerationAction } = require('../../utils/moderationLogger');

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
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the timeout')
                .setRequired(true)),

    async execute(interaction) {
        try {
            const permissionCheck = hasModPermission(interaction, PermissionsBitField.Flags.ModerateMembers);
            if (!permissionCheck.hasPermission) {
                return await interaction.reply({ content: permissionCheck.message, ephemeral: true });
            }

            const user = interaction.options.getUser('user');
            const duration = interaction.options.getString('duration');
            const reason = interaction.options.getString('reason');
            const member = await interaction.guild.members.fetch(user.id);

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

            await member.timeout(durationInMs, reason);

            // Log the action
            await logModerationAction(interaction.client, {
                actionType: 'timeout',
                user,
                moderator: interaction.user,
                reason,
                guild: interaction.guild,
                channel: interaction.channel,
                duration: duration
            });

            await interaction.reply({ 
                content: `⏰ Timed out ${user.tag} for ${duration} for: ${reason}`,
                ephemeral: true 
            });
        } catch (error) {
            console.error('Error in timeout command:', error);
            await interaction.reply({ 
                content: '❌ An error occurred while timing out the user.',
                ephemeral: true 
            });
        }
    }
}; 