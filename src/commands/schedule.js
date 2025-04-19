const schedule = require('node-schedule');

const scheduledJobs = new Map();

module.exports = {
    name: 'schedule',
    description: 'Schedule, list, or delete scheduled messages',
    options: [
        {
            name: 'action',
            type: 3,
            description: 'Choose an action: schedule, list, delete',
            required: true,
            choices: [
                { name: 'schedule', value: 'schedule' },
                { name: 'list', value: 'list' },
                { name: 'delete', value: 'delete' }
            ]
        },
        {
            name: 'message',
            type: 3,
            description: 'Message to be scheduled (required for scheduling)',
            required: false
        },
        {
            name: 'datetime',
            type: 3,
            description: 'Optional: Date and time (e.g., "2024-06-15 14:30", "14:30", or "tomorrow 09:00")',
            required: false
        },
        {
            name: 'job_id',
            type: 3,
            description: 'Job ID to delete (required for deletion)',
            required: false
        }
    ],
    execute: async (interaction) => {
        const action = interaction.options.getString('action');

        if (action === 'list') {
            if (scheduledJobs.size === 0) {
                return await interaction.reply('No scheduled messages found. 📭');
            }
            const jobs = Array.from(scheduledJobs.entries()).map(([id, job]) => `**ID:** ${id}, **Message:** ${job.message}, **Date:** ${job.date.toLocaleString()}`).join('\n');
            return await interaction.reply(`📋 **Scheduled Messages:**\n${jobs}`);
        }

        if (action === 'delete') {
            const jobId = interaction.options.getString('job_id');
            if (!jobId || !scheduledJobs.has(jobId)) {
                return await interaction.reply('Invalid Job ID provided or job not found. ❌');
            }

            const { job } = scheduledJobs.get(jobId);
            if (job && typeof job.cancel === 'function') {
                job.cancel();
            }
            scheduledJobs.delete(jobId);
            return await interaction.reply(`Scheduled message with ID **${jobId}** has been deleted. 🗑️`);
        }

        if (action === 'schedule') {
            const message = interaction.options.getString('message');
            const datetime = interaction.options.getString('datetime');

            if (!message) {
                return await interaction.reply('Message content is required to schedule a message. ✍️');
            }

            let date;
            if (!datetime) {
                await interaction.channel.send(message);
                return await interaction.reply('Message sent immediately! ✅');
            } else if (/^\d{2}:\d{2}$/.test(datetime)) {
                const [hours, minutes] = datetime.split(':').map(Number);
                date = new Date();
                date.setHours(hours, minutes, 0);
                if (date < new Date()) date.setDate(date.getDate() + 1);
            } else if (/^tomorrow \d{2}:\d{2}$/.test(datetime.toLowerCase())) {
                const [_, time] = datetime.split(' ');
                const [hours, minutes] = time.split(':').map(Number);
                date = new Date();
                date.setDate(date.getDate() + 1);
                date.setHours(hours, minutes, 0);
            } else {
                date = new Date(datetime);
            }

            if (isNaN(date)) {
                return await interaction.reply('Invalid date/time format. Try "2024-06-15 14:30", "14:30", or "tomorrow 09:00".');
            }

            const jobId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const job = schedule.scheduleJob(date, () => {
                interaction.channel.send(message);
                scheduledJobs.delete(jobId);
            });

            scheduledJobs.set(jobId, { job, message, date });
            await interaction.reply(`Message scheduled for ${date.toLocaleString()} ✅\n**Job ID:** ${jobId}`);
        }
    }
}; 