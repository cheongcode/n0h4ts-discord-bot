const { ChannelType, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');

const tempChats = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tempchat')
        .setDescription('Create a temporary text channel')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Name of the text channel')
                .setRequired(true)),

    async execute(interaction) {
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