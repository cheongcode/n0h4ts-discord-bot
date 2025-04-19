const { ChannelType } = require('discord.js');
const tempChannels = new Map();

module.exports = {
    name: 'voiceStateUpdate',
    async execute(oldState, newState) {
        try {
            // Check if user left a temporary channel
            if (oldState.channel && tempChannels.has(oldState.channel.id)) {
                const channel = oldState.channel;
                if (channel.members.size === 0) {
                    tempChannels.get(channel.id).lastEmpty = Date.now();
                    setTimeout(async () => {
                        if (channel.members.size === 0) {
                            await channel.delete();
                            tempChannels.delete(channel.id);
                        }
                    }, 5 * 60 * 1000); // 5 minutes
                }
            }
        } catch (error) {
            console.error('Error in voiceStateUpdate:', error);
        }
    }
}; 