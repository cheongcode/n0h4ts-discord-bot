module.exports = {
  name: 'serverinfo',
  description: 'Displays information about the current server',
  execute(interaction) {
    const guild = interaction.guild;
    const createdAt = new Date(guild.createdTimestamp).toLocaleDateString();
    
    interaction.reply({
      content: `🏰 **${guild.name}**\n👥 Members: ${guild.memberCount}\n📅 Created: ${createdAt}`,
      ephemeral: true
    });
  }
}; 