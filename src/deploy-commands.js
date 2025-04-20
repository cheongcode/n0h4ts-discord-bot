const { REST, Routes } = require('discord.js');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Table = require('cli-table3');

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    underscore: '\x1b[4m',
    blink: '\x1b[5m',
    reverse: '\x1b[7m',
    hidden: '\x1b[8m',
    
    fg: {
        black: '\x1b[30m',
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m',
        white: '\x1b[37m',
    },
    bg: {
        black: '\x1b[40m',
        red: '\x1b[41m',
        green: '\x1b[42m',
        yellow: '\x1b[43m',
        blue: '\x1b[44m',
        magenta: '\x1b[45m',
        cyan: '\x1b[46m',
        white: '\x1b[47m',
    }
};

// Function to load commands from a directory
function loadCommandsFromDir(dir) {
    const commands = [];
    const commandFiles = fs.readdirSync(dir).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        try {
            const command = require(path.join(dir, file));
            if (command.data) {
                const cmdData = command.data.toJSON();
                // Process options to ensure they have proper descriptions
                if (cmdData.options) {
                    cmdData.options = cmdData.options.map(opt => ({
                        name: opt.name || '',
                        description: opt.description || '',
                        required: opt.required || false,
                        type: opt.type || 3
                    }));
                }
                commands.push(cmdData);
            }
        } catch (error) {
            console.error(`Error loading command from ${file}:`, error);
        }
    }

    return commands;
}

// Load commands from all directories
const rootCommands = loadCommandsFromDir(path.join(__dirname, 'commands'));
const moderationCommands = loadCommandsFromDir(path.join(__dirname, 'commands/moderation'));

// Combine all commands
const commands = [...rootCommands, ...moderationCommands];

// Register commands
const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

(async () => {
    try {
        console.log('🔄 Registering slash commands...\n');
        
        // Create a table for commands
        const table = new Table({
            head: ['Command', 'Description', 'Status'],
            colWidths: [20, 50, 15],
            style: {
                head: ['cyan'],
                border: ['cyan']
            }
        });

        commands.forEach(cmd => {
            // Get command status based on category
            let status = '🟢 Active';
            if (cmd.name.startsWith('temp')) {
                status = '🔵 Temp';
            } else if (cmd.name === 'cve') {
                status = '🟣 CVE';
            } else if (cmd.name === 'schedule') {
                status = '🟡 Sched';
            } else if (['warn', 'kick', 'ban', 'timeout', 'purge', 'infractions', 'clearwarns'].includes(cmd.name)) {
                status = '🔴 Mod';
            }

            // Format command options
            let description = cmd.description;
            if (cmd.options && cmd.options.length > 0) {
                description += '\n' + cmd.options.map(opt => {
                    const required = opt.required ? ' (required)' : ' (optional)';
                    return `└─ ${opt.name}: ${opt.description}${required}`;
                }).join('\n');
            }

            table.push([`/${cmd.name}`, description, status]);
        });

        console.log(table.toString());
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