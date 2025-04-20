const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  name: 'whoami',
  description: 'Displays your Discord user information',
  execute(interaction) {
    const user = interaction.user;
    interaction.reply(`👤 You are ${user.tag} (ID: ${user.id})`);
  }
}; 