const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

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
        // Check if the executor has the necessary permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return interaction.reply({
                content: '❌ You do not have permission to mute members.',
                ephemeral: true
            });
        }

        const targetUser = interaction.options.getUser('user');
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        
        // Get duration in minutes (default to 5 minutes if not specified)
        const durationMinutes = interaction.options.getInteger('duration') || 5;
        // Convert minutes to milliseconds (Discord API works with milliseconds)
        const durationMs = durationMinutes * 60 * 1000;
        
        // Get reason (or use default)
        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Check if the user exists in the server
        if (!targetMember) {
            return interaction.reply({
                content: '❌ User not found in this server.',
                ephemeral: true
            });
        }

        // Check if the bot can moderate the target user
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return interaction.reply({
                content: '❌ I don\'t have permission to mute members.',
                ephemeral: true
            });
        }

        // Check if the target is moderatable (not higher role than the bot)
        if (!targetMember.moderatable) {
            return interaction.reply({
                content: '❌ I cannot mute this user. They may have a higher role than me.',
                ephemeral: true
            });
        }

        // Check if the executor is trying to mute someone with a higher role
        if (
            interaction.member.roles.highest.position <= targetMember.roles.highest.position &&
            interaction.guild.ownerId !== interaction.user.id
        ) {
            return interaction.reply({
                content: '❌ You cannot mute someone with a higher or equal role to you.',
                ephemeral: true
            });
        }

        try {
            // Add a defer reply to give more time for the timeout operation to complete
            await interaction.deferReply();
            
            // Discord uses timeouts to "mute" users
            await targetMember.timeout(durationMs, reason);
            
            // Send confirmation message
            await interaction.editReply({
                content: `✅ ${targetUser.tag} has been muted for ${durationMinutes} minute(s).\nReason: ${reason}`
            });
            
            // Optional: DM the user to let them know they've been muted
            try {
                await targetUser.send(
                    `You have been muted in **${interaction.guild.name}**'s server for ${durationMinutes} minute(s).\nReason: ${reason}`
                );
            } catch (err) {
                // User might have DMs closed, we can ignore this error
                console.log(`Could not DM user ${targetUser.tag} about their mute.`);
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