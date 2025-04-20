const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const infractionsPath = path.join(__dirname, '../../data/infractions.json');
const COMMUNITY_TEAM_ROLE_ID = '1246787318501740626';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearwarns')
        .setDescription('Clear all warnings for a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to clear warnings for')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        try {
            // Check if user has Community Team role
            const member = interaction.member;
            if (!member.roles.cache.has(COMMUNITY_TEAM_ROLE_ID)) {
                return await interaction.reply({
                    content: '❌ You do not have permission to use this command. Only Community Team members can use this command.',
                    ephemeral: true
                });
            }

            const user = interaction.options.getUser('user');
            
            // Load infractions
            let infractions = {};
            if (fs.existsSync(infractionsPath)) {
                infractions = JSON.parse(fs.readFileSync(infractionsPath, 'utf8'));
            }

            // Initialize guild infractions if not exists
            if (!infractions[interaction.guild.id]) {
                infractions[interaction.guild.id] = {};
            }

            // Clear user's warnings
            infractions[interaction.guild.id][user.id] = [];

            // Save updated infractions
            fs.writeFileSync(infractionsPath, JSON.stringify(infractions, null, 2));

            await interaction.reply({
                content: `✅ All warnings have been cleared for ${user.tag}.`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Error in clearwarns command:', error);
            await interaction.reply({
                content: '❌ An error occurred while clearing warnings.',
                ephemeral: true
            });
        }
    }
}; 