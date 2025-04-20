const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { hasModPermission } = require('../../utils/permissions');
const { logModerationAction } = require('../../utils/moderationLogger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Delete multiple messages')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to delete (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)),

    async execute(interaction) {
        try {
            const permissionCheck = hasModPermission(interaction, PermissionsBitField.Flags.ManageMessages);
            if (!permissionCheck.hasPermission) {
                return await interaction.reply({ content: permissionCheck.message, ephemeral: true });
            }

            const amount = interaction.options.getInteger('amount');

            // Fetch messages
            const messages = await interaction.channel.messages.fetch({ limit: amount });
            
            // Filter out messages older than 14 days
            const deletableMessages = messages.filter(msg => {
                const messageAge = Date.now() - msg.createdTimestamp;
                return messageAge <= 14 * 24 * 60 * 60 * 1000; // 14 days in milliseconds
            });

            if (deletableMessages.size === 0) {
                return await interaction.reply({ 
                    content: '❌ No messages were deleted. Messages must be less than 14 days old to be deleted.',
                    ephemeral: true 
                });
            }

            // Delete messages
            await interaction.channel.bulkDelete(deletableMessages, true);

            // Log the action
            await logModerationAction(interaction.client, {
                actionType: 'purge',
                user: interaction.user,
                moderator: interaction.user,
                reason: `Purged ${deletableMessages.size} messages`,
                guild: interaction.guild,
                channel: interaction.channel
            });

            await interaction.reply({ 
                content: `🧹 Deleted ${deletableMessages.size} messages${deletableMessages.size < messages.size ? ' (some messages were too old to delete)' : ''}`,
                ephemeral: true 
            });
        } catch (error) {
            console.error('Error in purge command:', error);
            await interaction.reply({ 
                content: '❌ An error occurred while deleting messages. Make sure the messages are less than 14 days old.',
                ephemeral: true 
            });
        }
    }
}; 