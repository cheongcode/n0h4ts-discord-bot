const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Lists all available commands'),

  execute(interaction) {
    const commands = interaction.client.commands;
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('📚 Available Commands')
      .setDescription('Here are all the available commands:')
      .addFields(
        { name: '🟢 Basic Commands', value: commands.filter(cmd => 
          !cmd.data.name.startsWith('temp') && 
          !['warn', 'kick', 'ban', 'timeout', 'purge', 'infractions', 'clearwarns'].includes(cmd.data.name) &&
          cmd.data.name !== 'cve' &&
          cmd.data.name !== 'schedule'
        ).map(cmd => `\`/${cmd.data.name}\` - ${cmd.data.description}`).join('\n') || 'No commands available' },
        { name: '🔵 Temporary Channels', value: commands.filter(cmd => 
          cmd.data.name.startsWith('temp')
        ).map(cmd => `\`/${cmd.data.name}\` - ${cmd.data.description}`).join('\n') || 'No commands available' },
        { name: '🟣 CVE Information', value: commands.filter(cmd => 
          cmd.data.name === 'cve'
        ).map(cmd => `\`/${cmd.data.name}\` - ${cmd.data.description}`).join('\n') || 'No commands available' },
        { name: '🟡 Scheduling', value: commands.filter(cmd => 
          cmd.data.name === 'schedule'
        ).map(cmd => `\`/${cmd.data.name}\` - ${cmd.data.description}`).join('\n') || 'No commands available' },
        { name: '🔴 Moderation', value: commands.filter(cmd => 
          ['warn', 'kick', 'ban', 'timeout', 'purge', 'infractions', 'clearwarns'].includes(cmd.data.name)
        ).map(cmd => `\`/${cmd.data.name}\` - ${cmd.data.description}`).join('\n') || 'No commands available' }
      )
      .setFooter({ text: 'Use /help <command> for more details about a specific command' });

    interaction.reply({ embeds: [embed], ephemeral: true });
  }
}; 