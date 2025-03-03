const { EmbedBuilder, ChannelType, PermissionsBitField } = require('discord.js');

async function createMsgLogChannel(guild, category) {
    let channel = guild.channels.cache.find(c => c.name === "msg-log");
    if (!channel) {
        channel = await guild.channels.create({
            name: "msg-log",
            type: ChannelType.GuildText,
            parent: category?.id || null,
            permissionOverwrites: [
                { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                { id: guild.roles.highest.id, allow: [PermissionsBitField.Flags.ViewChannel] }
            ]
        });
    }
    return channel; // ✅ Return the created/found channel
}

async function handleMessageLog(message) {
    if (!message?.guild || message.author.bot) return; // Ignore DMs & bot messages

    const logChannel = message.guild.channels.cache.find(c => c.name === "msg-log" && c.type === ChannelType.GuildText);
    if (!logChannel) return; // If no log channel, exit

    let embed = new EmbedBuilder()
        .setColor("Blue")
        .setTitle("📝 Message Sent")
        .setDescription(`**Message sent in <#${message.channel.id}>**`)
        .addFields(
            { name: "User", value: `<@${message.author.id}>`, inline: true },
            { name: "Message ID", value: message.id, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: "Message Log", iconURL: message.author.displayAvatarURL() });

    // ✅ Handle long messages properly
    if (message.content.length > 1024) {
        embed.addFields({ name: "Content", value: "📄 Message too long to log." });
    } else {
        embed.addFields({ name: "Content", value: message.content || "No content available" });
    }

    await logChannel.send({ embeds: [embed] });
}

async function handleMessageEdit(oldMessage, newMessage) {
    if (!oldMessage?.guild || oldMessage.author.bot || oldMessage.content === newMessage.content) return; 

    const logChannel = oldMessage.guild.channels.cache.find(c => c.name === "msg-log" && c.type === ChannelType.GuildText);
    if (!logChannel) return;

    let embed = new EmbedBuilder()
        .setColor("Orange")
        .setTitle("✏️ Message Edited")
        .setDescription(`**Message edited in <#${newMessage.channel.id}>**`)
        .addFields(
            { name: "User", value: `<@${newMessage.author.id}>`, inline: true },
            { name: "Message ID", value: newMessage.id, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: "Message Log", iconURL: newMessage.author.displayAvatarURL() });

    // ✅ Handle long messages
    let oldContent = oldMessage.content.length > 1024 ? "📄 Previous message too long to log." : oldMessage.content;
    let newContent = newMessage.content.length > 1024 ? "📄 New message too long to log." : newMessage.content;

    embed.addFields({ name: "Before", value: oldContent || "No content available" });
    embed.addFields({ name: "After", value: newContent || "No content available" });

    await logChannel.send({ embeds: [embed] });
}

async function handleMessageDelete(message) {
    if (!message?.guild || message.author.bot) return;

    const logChannel = message.guild.channels.cache.find(c => c.name === "msg-log" && c.type === ChannelType.GuildText);
    if (!logChannel) return;

    let embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("🗑️ Message Deleted")
        .setDescription(`**Message deleted in <#${message.channel.id}>**`)
        .addFields(
            { name: "User", value: `<@${message.author.id}>`, inline: true },
            { name: "Message ID", value: message.id, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: "Message Log", iconURL: message.author.displayAvatarURL() });

    // ✅ Only log content if it exists & isn't too long
    if (message.content) {
        let content = message.content.length > 1024 ? "📄 Deleted message too long to log." : message.content;
        embed.addFields({ name: "Content", value: content });
    } else {
        embed.addFields({ name: "Content", value: "No content available" });
    }

    await logChannel.send({ embeds: [embed] });
}

module.exports = {
    createMsgLogChannel,  
    handleMessageLog, 
    handleMessageEdit, 
    handleMessageDelete
};
