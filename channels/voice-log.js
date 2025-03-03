const { EmbedBuilder, ChannelType, PermissionsBitField } = require('discord.js');

async function createVoiceLogChannel(guild, category) {
    let channel = guild.channels.cache.find(c => c.name === "voice-log");
    if (!channel) {
        channel = await guild.channels.create({
            name: "voice-log",
            type: ChannelType.GuildText,
            parent: category.id,
            permissionOverwrites: [
                { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                { id: guild.roles.highest.id, allow: [PermissionsBitField.Flags.ViewChannel] }
            ]
        });
    }
    return channel;
}

async function handleVoiceLog(oldState, newState) {
    const { guild, member } = newState;
    if (!guild) return; // Ensure the guild exists

    const logChannel = guild.channels.cache.find(c => c.name === "voice-log" && c.type === ChannelType.GuildText);
    if (!logChannel) return;

    let action, channelName;
    if (!oldState.channel && newState.channel) {
        action = "joined";
        channelName = newState.channel.name;
    } else if (oldState.channel && !newState.channel) {
        action = "left";
        channelName = oldState.channel.name;
    } else if (oldState.channelId !== newState.channelId) {
        action = "moved";
        channelName = `${oldState.channel.name} ➜ ${newState.channel.name}`;
    } else {
        return;
    }

    const embed = new EmbedBuilder()
        .setColor(action === "joined" ? "Green" : action === "left" ? "Red" : "Blue")
        .setTitle("🎙️ Voice Channel Update")
        .setDescription(`**${member.user.tag}** has **${action}** a voice channel.`)
        .addFields(
            { name: "User", value: `<@${member.user.id}>`, inline: true },
            { name: "Channel", value: channelName, inline: true },
            { name: "User ID", value: member.user.id, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: "Voice Log", iconURL: guild.iconURL() });

    await logChannel.send({ embeds: [embed] });
}

module.exports = { createVoiceLogChannel, handleVoiceLog };
