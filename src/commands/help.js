module.exports = {
  name: 'help',
  description: 'Lists all available commands',
  execute(interaction) {
    const commands = interaction.client.commands;
    const commandList = Array.from(commands.values())
      .map(cmd => `**/${cmd.name}** - ${cmd.description}`)
      .join('\n');
    
    interaction.reply({
      content: `📚 **Available Commands**\n\n${commandList}`,
      ephemeral: true
    });
  }
}; 