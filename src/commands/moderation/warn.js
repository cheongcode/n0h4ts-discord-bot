const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { hasModPermission } = require('../../utils/permissions');
const { logModerationAction } = require('../../utils/moderationLogger');
const fs = require('fs');
const path = require('path');

const infractionsPath = path.join(__dirname, '../../data/infractions.json');

// Ensure data directory exists
if (!fs.existsSync(path.dirname(infractionsPath))) {
    fs.mkdirSync(path.dirname(infractionsPath), { recursive: true });
}

// Load or create infractions file
let infractions = {};
if (fs.existsSync(infractionsPath)) {
    infractions = JSON.parse(fs.readFileSync(infractionsPath, 'utf8'));
}

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

            // Initialize guild and user in infractions if needed
            if (!infractions[interaction.guild.id]) {
                infractions[interaction.guild.id] = {};
            }
            if (!infractions[interaction.guild.id][user.id]) {
                infractions[interaction.guild.id][user.id] = [];
            }

            // Add warning
            const warning = {
                reason,
                date: new Date().toISOString()
            };
            infractions[interaction.guild.id][user.id].push(warning);

            // Save to file
            fs.writeFileSync(infractionsPath, JSON.stringify(infractions, null, 2));

            // Log the action
            await logModerationAction(interaction.client, {
                actionType: 'warn',
                user,
                moderator: interaction.user,
                reason,
                guild: interaction.guild,
                channel: interaction.channel
            });

            // Check for auto-timeout
            if (infractions[interaction.guild.id][user.id].length >= 3) {
                await member.timeout(10 * 60 * 1000, 'Auto-timeout: 3 warnings');
                await interaction.followUp({ 
                    content: `⚠️ ${user.tag} has received 3 warnings and has been timed out for 10 minutes.`,
                    ephemeral: true 
                });
            }

            await interaction.reply({ 
                content: `⚠️ Warned ${user.tag} for: ${reason}`,
                ephemeral: true 
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