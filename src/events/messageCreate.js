const tempChats = new Map();

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        try {
            if (message.author.bot) return;
            
            if (tempChats.has(message.channel.id)) {
                tempChats.get(message.channel.id).lastMessage = Date.now();
                
                // Check if channel should be deleted
                const channelData = tempChats.get(message.channel.id);
                const timeSinceLastMessage = Date.now() - channelData.lastMessage;
                
                if (timeSinceLastMessage >= 5 * 60 * 1000) { // 5 minutes
                    await message.channel.delete();
                    tempChats.delete(message.channel.id);
                }
            }
        } catch (error) {
            console.error('Error in messageCreate:', error);
        }
    }
}; 