const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with pong.'),

  execute(interaction) {
    interaction.reply('pong 🧠');
  }
}; 