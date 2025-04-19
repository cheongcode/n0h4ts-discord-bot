const { REST, Routes } = require('discord.js');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Load all command files
const commands = fs.readdirSync(path.join(__dirname, 'commands'))
  .filter(file => file.endsWith('.js'))
  .map(file => {
    const command = require(`./commands/${file}`);
    return {
      name: command.name,
      description: command.description,
      options: command.options || []
    };
  });

// Register commands
const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    console.log('🔄 Registering slash commands...');
    console.log('\n📋 Available Commands:');
    commands.forEach(cmd => {
      console.log(`- /${cmd.name}: ${cmd.description}`);
      if (cmd.options && cmd.options.length > 0) {
        console.log('  Options:');
        cmd.options.forEach(opt => {
          console.log(`  - ${opt.name}: ${opt.description}${opt.required ? ' (required)' : ''}`);
        });
      }
    });
    console.log('\n');

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );

    console.log('✅ Commands registered successfully!');
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
})(); 