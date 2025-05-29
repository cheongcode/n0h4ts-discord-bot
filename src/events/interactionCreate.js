const handleButtonInteraction = require("../handlers/reportActionHandler");

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (interaction.isCommand()){
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        await interaction.reply({ content: '⚠️ Error executing command', ephemeral: true });
      }
    } else if (interaction.isButton()) {
      await handleButtonInteraction(interaction);
    }
  },
}; 