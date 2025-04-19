const { ChannelType, PermissionFlagsBits } = require('discord.js');

const tempChannels = new Map();

module.exports = {
    name: 'tempvc',
    description: 'Create a temporary voice channel',
    options: [
        {
            name: 'name',
            type: 3,
            description: 'Name of the voice channel',
            required: true
        },
        {
            name: 'user_limit',
            type: 4,
            description: 'Maximum number of users (optional)',
            required: false
        }
    ],
    execute: async (interaction) => {
        try {
            const name = interaction.options.getString('name');
            const userLimit = interaction.options.getInteger('user_limit');
            
            // Find or create the category for temporary channels
            let category = interaction.guild.channels.cache.find(
                c => c.type === ChannelType.GuildCategory && c.name === 'Temporary Channels'
            );

            if (!category) {
                category = await interaction.guild.channels.create({
                    name: 'Temporary Channels',
                    type: ChannelType.GuildCategory,
                    position: 0
                });
            }

            const channel = await interaction.guild.channels.create({
                name: name,
                type: ChannelType.GuildVoice,
                parent: category,
                userLimit: userLimit || 0,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        allow: [PermissionFlagsBits.Connect]
                    }
                ]
            });

            tempChannels.set(channel.id, {
                createdAt: Date.now(),
                lastEmpty: null
            });

            await interaction.reply(`Created temporary voice channel: ${channel} 🎤`);
        } catch (error) {
            console.error('Error creating temporary voice channel:', error);
            await interaction.reply('Failed to create temporary voice channel. ❌');
        }
    }
}; 