const { REST, Routes } = require('discord.js');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Table = require('cli-table3');

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    fg: {
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        cyan: '\x1b[36m',
    }
};

// Function to load commands from a directory with improved error handling
function loadCommandsFromDir(dir) {
    const commands = [];
    const fullPath = path.resolve(dir);
    
    console.log(`${colors.fg.cyan}Checking directory: ${fullPath}${colors.reset}`);
    
    if (!fs.existsSync(fullPath)) {
        console.warn(`${colors.fg.yellow}Directory not found: ${fullPath}${colors.reset}`);
        return commands;
    }

    const commandFiles = fs
        .readdirSync(fullPath)
        .filter((file) => file.endsWith('.js'));
        
    console.log(`${colors.fg.cyan}Found ${commandFiles.length} command files in ${fullPath}${colors.reset}`);

    for (const file of commandFiles) {
        try {
            const filePath = path.join(fullPath, file);
            console.log(`${colors.fg.cyan}Loading command from: ${filePath}${colors.reset}`);
            
            // Clear require cache to ensure fresh load
            delete require.cache[require.resolve(filePath)];
            
            const command = require(filePath);
            
            // For legacy command format (with execute method but no data)
            if (
                command.name &&
                command.description &&
                command.execute &&
                !command.data
            ) {
                // Convert legacy format to new format
                commands.push({
                    name: command.name,
                    description: command.description,
                    options: command.options || [],
                    // Add any other properties needed for deployment
                });
                console.log(`${colors.fg.green}📝 Loaded legacy command: ${command.name}${colors.reset}`);
            }
            // For new command format (with data property)
            else if (command.data) {
                const cmdData = command.data.toJSON();
                // Process options to ensure they have proper descriptions
                if (cmdData.options) {
                    cmdData.options = cmdData.options.map((opt) => ({
                        name: opt.name || '',
                        description: opt.description || '',
                        required: opt.required || false,
                        type: opt.type || 3,
                    }));
                }
                commands.push(cmdData);
                console.log(`${colors.fg.green}📝 Loaded command: ${cmdData.name}${colors.reset}`);
            } else {
                console.warn(`${colors.fg.yellow}⚠️ Command in ${file} has invalid format (missing name, description, execute, or data property)${colors.reset}`);
                // Log actual content for debugging
                console.log('Command structure:', JSON.stringify(Object.keys(command), null, 2));
            }
        } catch (error) {
            console.error(`${colors.fg.red}❌ Error loading command from ${file}:${colors.reset}`, error);
        }
    }

    return commands;
}

// Define command directories to check - add any additional directories here
const commandDirs = [
    path.join(__dirname, 'commands'),
    path.join(__dirname, 'commands/moderation')
];

// Load commands from all directories
let allCommands = [];
for (const dir of commandDirs) {
    const dirCommands = loadCommandsFromDir(dir);
    console.log(`Loaded ${dirCommands.length} commands from ${dir}`);
    allCommands = [...allCommands, ...dirCommands];
}

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
                border: ['cyan'],
            },
        });

        if (allCommands.length === 0) {
            console.error(`${colors.fg.red}❌ No commands were loaded! Check your directory structure.${colors.reset}`);
            return;
        }

        allCommands.forEach((cmd) => {
            // Get command status based on category
            let status = '🟢 Active';
            if (cmd.name.startsWith('temp')) {
                status = '🔵 Temp';
            } else if (cmd.name === 'cve') {
                status = '🟣 CVE';
            } else if (cmd.name === 'schedule') {
                status = '🟡 Sched';
            } else if (
                [
                    'warn',
                    'kick',
                    'ban',
                    'timeout',
                    'mute',
                    'purge',
                    'infractions',
                    'clearwarns',
                ].includes(cmd.name)
            ) {
                status = '🔴 Mod';
            } else if (cmd.name === 'flag') {
                status = '🟠 Flag';
            }

            // Format command options
            let description = cmd.description;
            if (cmd.options && cmd.options.length > 0) {
                description +=
                    '\n' +
                    cmd.options
                        .map((opt) => {
                            const required = opt.required
                                ? ' (required)'
                                : ' (optional)';
                            return `└─ ${opt.name}: ${opt.description}${required}`;
                        })
                        .join('\n');
            }

            table.push([`/${cmd.name}`, description, status]);
        });

        console.log(table.toString());
        console.log('\n');

        // Verify bot token and client ID are available before proceeding
        if (!process.env.BOT_TOKEN) {
            console.error(`${colors.fg.red}❌ BOT_TOKEN not found in environment variables${colors.reset}`);
            return;
        }
        if (!process.env.CLIENT_ID) {
            console.error(`${colors.fg.red}❌ CLIENT_ID not found in environment variables${colors.reset}`);
            return;
        }
        if (!process.env.GUILD_ID) {
            console.error(`${colors.fg.red}❌ GUILD_ID not found in environment variables${colors.reset}`);
            return;
        }

        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID,
                process.env.GUILD_ID
            ),
            { body: allCommands }
        );

        console.log(`${colors.fg.green}✅ Successfully registered ${allCommands.length} commands!${colors.reset}`);
    } catch (error) {
        console.error(`${colors.fg.red}❌ Error registering commands:${colors.reset}`, error);
    }
})();