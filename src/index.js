const { Client, Collection, GatewayIntentBits } = require('discord.js');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

client.commands = new Collection();

// Function to load commands from a directory
function loadCommandsFromDir(dir) {
  const commandFiles = fs.readdirSync(dir).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    try {
      const command = require(path.join(dir, file));
      if (command.data) {
        client.commands.set(command.data.name, command);
      }
    } catch (error) {
      console.error(`Error loading command from ${file}:`, error);
    }
  }
}

// Load commands from all directories
loadCommandsFromDir(path.join(__dirname, 'commands'));
loadCommandsFromDir(path.join(__dirname, 'commands/moderation'));

// Load events
const eventFiles = fs.readdirSync(path.join(__dirname, 'events')).filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

client.login(process.env.BOT_TOKEN);
