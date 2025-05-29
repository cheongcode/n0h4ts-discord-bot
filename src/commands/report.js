const { SlashCommandBuilder, EmbedBuilder, ChannelType, PermissionsBitField, ButtonBuilder, ActionRowBuilder, ButtonStyle     } = require('discord.js');

// CONFIGURATION: temporary moderation channel. Will be configured using `/config report` functionality
const MOD_CHANNEL_ID = '1333302344544288818';
const allowedContentTypes = ['image/jpeg', 'image/png'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('report')
        .setDescription('Report a user to the server moderators.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user you want to report.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for reporting this user.')
                .setRequired(true))
        .addAttachmentOption(option =>
            option.setName('proof1')
                .setDescription('Optional proof image(JPG, PNG) #1')
                .setRequired(false))
        .addAttachmentOption(option =>
            option.setName('proof2')
                .setDescription('Optional proof image(JPG, PNG) #2')
                .setRequired(false))
        .addAttachmentOption(option =>
            option.setName('proof3')
                .setDescription('Optional proof image(JPG, PNG) #3')
                .setRequired(false)),

    async execute(interaction) {
        const reportedUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
        const reporter = interaction.user;
        const proofAttachments = [
            interaction.options.getAttachment('proof1'),
            interaction.options.getAttachment('proof2'),
            interaction.options.getAttachment('proof3')
        ].filter(Boolean);
        const guild = interaction.guild;

        if (!guild) {
            return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
        }

        if (reportedUser.id === reporter.id) {
            return interaction.reply({ content: 'You cannot report yourself. 🤔', ephemeral: true });
        }

        if (reportedUser.bot) {
            return interaction.reply({ content: 'You cannot report a bot. 🤖', ephemeral: true });
        }

        // ------ Check attachment types ------
        for (const att of proofAttachments) {
            if (!allowedContentTypes.includes(att.contentType)) {
                await interaction.followUp({
                    content: `The file "${att.name}" has an unsupported file type (${att.contentType}). Please only upload supported file types (e.g., JPG, PNG). This proof will not be processed.`,
                    ephemeral: true
                });
            }
        }

        // ------ Log to console ------
        console.log(`[REPORT] Reporter: ${reporter} (${reporter.id}) | Reported User: ${reportedUser} (${reportedUser.id}) | Reason: ${reason} | Guild: ${guild.name} (${guild.id}) | Timestamp: ${new Date().toISOString()}`);

        // ------ Log Report for review ------
        try {
            const modChannel = await guild.channels.fetch(MOD_CHANNEL_ID);

            if (modChannel && modChannel.type === ChannelType.GuildText && modChannel.permissionsFor(guild.members.me).has(PermissionsBitField.Flags.SendMessages)) {
                const reportEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle(':rotating_light: User Report')
                    .addFields(
                        { name: '<:user_red:1377183928506384526> Reported', value: `${reportedUser}`, inline: true  },
                        { name: '<:user:1377183926451310714> Reporter', value: `${reporter}`, inline: true },
                        { name: '<:info:1377183920948510810> Reason', value: reason },
                    )
                    .setThumbnail(reportedUser.displayAvatarURL())
                    .setTimestamp()
                    .setURL('https://n0h4ts.com/') // Workaround to allow multiple image in 1 embed
                    .setFooter({ text: `Report ID: ${interaction.id}` });

                const embedArr = [];

                if(proofAttachments.length > 0){
                    reportEmbed.addFields({ name: '<:termsinfo:1377183922932416522> Proof: ', value: '' })
                }

                if(proofAttachments.length == 1){
                    reportEmbed.setImage(proofAttachments[0].url);
                }else{
                    for (let i = 0; i < proofAttachments.length; i++) {
                        console.log(proofAttachments.length);
                        const imageEmbed = new EmbedBuilder().setURL('https://n0h4ts.com/').setImage(proofAttachments[i].url).addFields({ name: '', value: ``});
                        embedArr.push(imageEmbed)
                    }
                }


                // ----- Action buttons -----
                const prefix = 'report'; // To identify these buttons
                const reportContext = `${reportedUser.id}_${interaction.id}`; // userid and interactionid

                const banButton = new ButtonBuilder()
                    .setCustomId(`${prefix}_ban_${reportContext}`)
                    .setLabel('Ban')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('<:hammer:1377183919144833094>');

                const kickButton = new ButtonBuilder()
                    .setCustomId(`${prefix}_kick_${reportContext}`)
                    .setLabel('Kick')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('<:barefoot:1377183911897206806>');

                const timeoutButton = new ButtonBuilder()
                    .setCustomId(`${prefix}_timeout_${reportContext}`)
                    .setLabel('Timeout')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('<:clock:1377183915738927184>');

                const muteButton = new ButtonBuilder()
                    .setCustomId(`${prefix}_mute_${reportContext}`)
                    .setLabel('Mute')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('<:volumemute:1377254113271877632>');

                const warnButton = new ButtonBuilder()
                    .setCustomId(`${prefix}_warn_${reportContext}`)
                    .setLabel('Warn')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('<:trianglewarning:1377183924651823176>');

                const noneButton = new ButtonBuilder()
                    .setCustomId(`${prefix}_none_${reportContext}`)
                    .setLabel('Dismiss')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('<:check:1377183913797222462>');

                const actionRow = new ActionRowBuilder()
                    .addComponents(banButton, kickButton, timeoutButton, warnButton, noneButton);

                await modChannel.send({ embeds: [reportEmbed, ...embedArr], components: [actionRow]});


                // ------ Success acknowledge report ------
                const successEmbed = new EmbedBuilder()
                    .setColor(0x57F287)
                    // .setTitle('Report Submitted Successfully')
                    .setDescription(`You have successfully submitted a report on ${reportedUser}.`)
                    .addFields({ name: 'Reason', value: reason, inline: true })

                if (proofAttachments.length > 0) {
                    successEmbed.addFields({
                        name: 'Proof Attached',
                        value: proofAttachments.map(att => `\`${att.name}\` (${(att.size / 1024).toFixed(2)} KB)`).join('\n')
                    });
                }

                await interaction.reply({
                    embeds: [successEmbed],
                    ephemeral: true
                });

            } else if (modChannel) {
                console.error(`[REPORT ERROR] Could not find or send to moderation channel (ID: ${MOD_CHANNEL_ID}). Configure channel ID using \`/config report\`.`);
            }
        } catch (error) {
            console.error(`[REPORT ERROR] Failed to send report to moderation channel: `, error);
        }


    }
};
