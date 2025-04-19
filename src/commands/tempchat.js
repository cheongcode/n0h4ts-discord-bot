const { ChannelType, PermissionFlagsBits } = require('discord.js');

const tempChats = new Map();

module.exports = {
    name: 'tempchat',
    description: 'Create a temporary text channel',
    options: [
        {
            name: 'name',
            type: 3,
            description: 'Name of the text channel',
            required: true
        }
    ],
    execute: async (interaction) => {
        try {
            const name = interaction.options.getString('name');
            
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
                type: ChannelType.GuildText,
                parent: category,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                    }
                ]
            });

            tempChats.set(channel.id, {
                createdAt: Date.now(),
                lastMessage: Date.now()
            });

            await interaction.reply(`Created temporary text channel: ${channel} 💬`);
        } catch (error) {
            console.error('Error creating temporary text channel:', error);
            await interaction.reply('Failed to create temporary text channel. ❌');
        }
    }
}; 