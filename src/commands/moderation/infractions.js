const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const infractionsPath = path.join(__dirname, '../../data/infractions.json');
const COMMUNITY_TEAM_ROLE_ID = '1246787318501740626';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('infractions')
        .setDescription('View a user\'s warnings')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to check')
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

            const userInfractions = infractions[interaction.guild.id]?.[user.id] || [];

            if (userInfractions.length === 0) {
                return await interaction.reply({ 
                    content: `📝 ${user.tag} has no warnings.`,
                    ephemeral: true 
                });
            }

            const infractionList = userInfractions.map((inf, index) => 
                `${index + 1}. **${new Date(inf.date).toLocaleString()}**\n   Reason: ${inf.reason}`
            ).join('\n\n');

            await interaction.reply({ 
                content: `📝 **Warnings for ${user.tag}**\n\n${infractionList}`,
                ephemeral: true 
            });
        } catch (error) {
            console.error('Error in infractions command:', error);
            await interaction.reply({ 
                content: '❌ An error occurred while fetching infractions.',
                ephemeral: true 
            });
        }
    }
}; 