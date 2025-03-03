const { EmbedBuilder, ChannelType, PermissionsBitField } = require('discord.js');

async function createUserLogChannel(guild, category) {
    let channel = guild.channels.cache.find(c => c.name === "user-log");
    if (!channel) {
        channel = await guild.channels.create({
            name: "user-log",
            type: ChannelType.GuildText,
            parent: category.id,
            permissionOverwrites: [
                { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                { id: guild.roles.highest.id, allow: [PermissionsBitField.Flags.ViewChannel] }
            ]
        });
    }
    return channel; // ✅ Return the created/found channel
}

async function handleUserLog(member, action) {
    const guild = member.guild;

    // ✅ Fetch the user-log channel
    const logChannel = guild.channels.cache.find(c => c.name === "user-log" && c.type === ChannelType.GuildText);
    if (!logChannel) return; 

    const embed = new EmbedBuilder()
        .setColor(action === "joined" ? "Green" : "Red")
        .setTitle(action === "joined" ? "✅ Member Joined" : "❌ Member Left")
        .setDescription(`**${member.user.tag}** has **${action}** the server.`)
        .addFields(
            { name: "User", value: `<@${member.user.id}>`, inline: true },
            { name: "User ID", value: member.user.id, inline: true },
            { name: "Account Created", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true }
        )
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setTimestamp()
        .setFooter({ text: "User Log", iconURL: member.user.displayAvatarURL() });

    await logChannel.send({ embeds: [embed] });
}

// ✅ Export both functions correctly
module.exports = {
    createUserLogChannel, 
    handleUserLog
};
