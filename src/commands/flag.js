const { PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '..', 'commands', 'flags.json');

let FLAGS_CONFIG = {};
try {
    const configData = fs.readFileSync(configPath, 'utf8');
    FLAGS_CONFIG = JSON.parse(configData);
} catch (error) {
    console.error('Error loading flags configuration:', error);
    FLAGS_CONFIG = {}; // fallback to empty config
}

module.exports = {
    name: 'flag',
    description: 'Submit a flag to receive a special role',
    options: [
        {
            name: 'value',
            description: 'The flag value to submit',
            type: 3, // type 3 = string
            required: true
        }
    ],
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const submittedFlag = interaction.options.getString('value');

        // check if the submitted flag exists in our configuration
        if (FLAGS_CONFIG[submittedFlag]) {
            const flagData = FLAGS_CONFIG[submittedFlag];
            const ROLE_ID = flagData.roleId;
            try {
                const member = interaction.member;

                // check if the role exists
                const role = interaction.guild.roles.cache.get(ROLE_ID);
                if (!role) {
                    return interaction.editReply({
                        content: '❌ Configuration error: The role specified does not exist. Please contact an administrator.',
                        ephemeral: true
                    });
                }

                // check if the user already has the role
                if (member.roles.cache.has(ROLE_ID)) {
                    return interaction.editReply({
                        content: '✅ You already have the role!',
                        ephemeral: true
                    });
                }

                // check if the bot has permission to assign roles
                const botMember = interaction.guild.members.cache.get(interaction.client.user.id);
                if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
                    return interaction.editReply({
                        content: '❌ I don\'t have permission to assign roles. Please contact an administrator.',
                        ephemeral: true
                    });
                }

                // check if the bot's highest role is higher than the role to assign
                if (botMember.roles.highest.position <= role.position) {
                    return interaction.editReply({
                        content: '❌ I can\'t assign that role because it\'s higher than or equal to my highest role.',
                        ephemeral: true
                    });
                }

                // add the role to the user
                await member.roles.add(ROLE_ID);

                // Use the custom congratulations message from flags.json or fall back to a default message
                const congratsMessage = flagData.message || '🎉 Congratulations! You\'ve found the correct flag and received a special role!';

                interaction.editReply({
                    content: congratsMessage,
                    ephemeral: true
                });
            } catch (error) {
                console.error('Error assigning role:', error);
                interaction.editReply({
                    content: '❌ An error occurred while assigning the role. Please try again later.',
                    ephemeral: true
                });
            }
        } else {
            interaction.editReply({
                content: '❌ Incorrect flag. Please try again!',
                ephemeral: true
            });
        }
    }
}