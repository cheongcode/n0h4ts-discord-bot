const fs = require('fs');
const path = require('path');
const { logModerationAction } = require('./moderationLogger'); // Assuming this path is correct

async function performTimeout(targetMember, durationMs, reason, moderator, guild) {

    const auditLogReason = `Action by ${moderator.tag}. Reason: ${reason}`;
    let error = null;
    await targetMember.timeout(durationMs, auditLogReason);

    try {
        await targetMember.user.send( // DM timeout to user
            `You have been timed out in **${guild.name}** for ${durationMs / (60 * 1000)} minute(s).\nReason: ${reason}`
        );
    } catch (err) {
        console.log(`Could not DM user ${targetMember.user.tag} about their mute/timeout.`);
    }
    return {error}
}

async function performKick(targetMember, durationMs, reason, moderator, guild) {

    const auditLogReason = `Action by ${moderator.tag}. Reason: ${reason}`;
    let error = null;
    await targetMember.kick(auditLogReason);

    try {
        await targetMember.user.send( // DM timeout to user
            `You have been kicked out of **${guild.name}** for: ${reason}`
        );
    } catch (err) {
        error = `Could not DM user ${targetMember.user.tag} about their kick.`;
    }
    return {error}
}

async function performWarn(guild, targetMember, moderator, reason) {
    let infractions = {}
    infractions = loadInfractions();

    // Initialize guild and user in infractions if needed
    if (!infractions[guild.id]) {
        infractions[guild.id] = {};
    }

    if (!infractions[guild.id][targetMember]) {
        infractions[guild.id][targetMember] = [];
    }

    // Add warning
    const warning = {
        reason,
        date: new Date().toISOString()
    };

    infractions[guild.id][targetMember].push(warning);

    saveInfractions(infractions);

    const currentWarningsCount = infractions[guild.id][targetMember].length;
    let autoTimedOut = false;
    let error = null;

    try {
        await targetMember.user.send( // DM timeout to user
            `You have been warned in **${guild.name}** for: **${reason}**.`
        );
    } catch (err) {
        error = `Could not DM user ${targetMember.user.tag} about their mute/timeout.`;
    }

    // Check for auto-timeout
    if (currentWarningsCount >= 3) {
        autoTimedOut = true;
        await performTimeout(targetMember, 10 * 60 * 1000, 'Auto-timeout: 3 warnings', moderator, guild)
    }

    return {
        autoTimedOut,
        warningCount: currentWarningsCount,
        error
    };
}

const infractionsPath = path.join(__dirname, '../data/infractions.json');

function loadInfractions() {
    if (!fs.existsSync(infractionsPath)) {
        try {
            fs.writeFileSync(infractionsPath, JSON.stringify({}, null, 2), 'utf8');
        } catch (e) {
            console.error("Error creating infractions.json:", e);
            return {}
        }
    }

    try {
        return JSON.parse(fs.readFileSync(infractionsPath, 'utf8'));
    } catch (e) {
        console.error("Error parsing infractions.json, returning empty object:", e);
        return {};
    }
}

// Helper function to save infractions
function saveInfractions(infractionsData) {
    try {
        fs.writeFileSync(infractionsPath, JSON.stringify(infractionsData, null, 2));
    } catch (e) {
        console.error("Error writing to infractions.json:", e);
    }
}

module.exports = {
    performTimeout,
    performWarn
};
