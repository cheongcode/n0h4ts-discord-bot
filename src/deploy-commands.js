const { REST, Routes } = require('discord.js');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const commands = [];
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.push({
    name: command.name,
    description: command.description,
    options: command.options || []
  });
}

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    console.log('🔄 Refreshing application (/) commands...');

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands },
    );

    console.log('✅ Slash commands registered!');
  } catch (error) {
    console.error(error);
  }
})(); 