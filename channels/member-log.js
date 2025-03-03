const { EmbedBuilder, ChannelType, PermissionsBitField } = require('discord.js');

async function createMemberLogChannel(guild, category) {
    let channel = guild.channels.cache.find(c => c.name === "member-log");
    if (!channel) {
        channel = await guild.channels.create({
            name: "member-log",
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

async function handleMemberUpdate(oldMember, newMember) {
    const logChannel = newMember.guild.channels.cache.find(c => c.name === 'member-log');
    if (!logChannel) return;

    // Nickname Change
    if (oldMember.nickname !== newMember.nickname) {
        const embed = new EmbedBuilder()
            .setColor('Blue')
            .setTitle('👤 Nickname Updated')
            .setDescription(`**${newMember.user.tag}** updated their nickname.`)
            .addFields(
                { name: "New Nickname", value: newMember.nickname || 'None', inline: true }
            )
            .setTimestamp()
            .setFooter({ text: "Member Log", iconURL: newMember.guild.iconURL({ dynamic: true }) });

        await logChannel.send({ embeds: [embed] });
    }

    // Avatar Change
    if (oldMember.user.avatar !== newMember.user.avatar) {
        const embed = new EmbedBuilder()
            .setColor('Green')
            .setTitle('🖼️ Avatar Updated')
            .setDescription(`**${newMember.user.tag}** updated their avatar.`)
            .setImage(newMember.user.displayAvatarURL({ dynamic: true, size: 512 }))
            .setTimestamp()
            .setFooter({ text: "Member Log", iconURL: newMember.guild.iconURL({ dynamic: true }) });

        await logChannel.send({ embeds: [embed] });
    }

    // Role Change
    const oldRoles = oldMember.roles.cache.map(r => r.id);
    const newRoles = newMember.roles.cache.map(r => r.id);

    const addedRoles = newRoles.filter(id => !oldRoles.includes(id));
    const removedRoles = oldRoles.filter(id => !newRoles.includes(id));

    if (addedRoles.length > 0 || removedRoles.length > 0) {
        const addedRolesNames = addedRoles.map(id => `<@&${id}>`).join(', ') || 'None';
        const removedRolesNames = removedRoles.map(id => `<@&${id}>`).join(', ') || 'None';

        const embed = new EmbedBuilder()
            .setColor('Purple')
            .setTitle('🔄 Role Updated')
            .setDescription(`**${newMember.user.tag}**'s roles have been updated.`)
            .addFields(
                { name: "Added Roles", value: addedRolesNames, inline: true },
                { name: "Removed Roles", value: removedRolesNames, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: "Member Log", iconURL: newMember.guild.iconURL({ dynamic: true }) });

        await logChannel.send({ embeds: [embed] });
    }
}



async function handleMemberBan(guild, user) {
    const logChannel = guild.channels.cache.find(c => c.name === "member-log" && c.type === ChannelType.GuildText);
    if (!logChannel) return;

    const auditLogs = await guild.fetchAuditLogs({ type: 22, limit: 1 }); // 22 = MEMBER_BAN_ADD
    const logEntry = auditLogs.entries.first();
    const reason = logEntry ? logEntry.reason || "No reason provided" : "Unknown reason";

    const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("🔨 Member Banned")
        .setDescription(`**${user.tag}** has been banned.`)
        .addFields(
            { name: "User ID", value: user.id, inline: true },
            { name: "Reason", value: reason, inline: true }
        )
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setTimestamp()
        .setFooter({ text: "Member Log", iconURL: guild.iconURL() });

    await logChannel.send({ embeds: [embed] });
}

async function handleMemberUnban(guild, user) {
    const logChannel = guild.channels.cache.find(c => c.name === "member-log" && c.type === ChannelType.GuildText);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("✅ Member Unbanned")
        .setDescription(`**${user.tag}** has been unbanned from the server.`)
        .addFields({ name: "User ID", value: user.id, inline: true })
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setTimestamp()
        .setFooter({ text: "Member Log", iconURL: guild.iconURL() });

    await logChannel.send({ embeds: [embed] });
}

async function handleMemberTimeout(member) {
    const logChannel = member.guild.channels.cache.find(c => c.name === "member-log" && c.type === ChannelType.GuildText);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setColor("Orange")
        .setTitle("⏳ Member Timed Out")
        .setDescription(`**${member.user.tag}** has been placed in timeout.`)
        .addFields({ name: "User ID", value: member.user.id, inline: true })
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setTimestamp()
        .setFooter({ text: "Member Log", iconURL: member.guild.iconURL() });

    await logChannel.send({ embeds: [embed] });
}

async function handleRemoveTimeout(member) {
    const logChannel = member.guild.channels.cache.find(c => c.name === "member-log" && c.type === ChannelType.GuildText);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("⌛ Timeout Removed")
        .setDescription(`**${member.user.tag}**'s timeout has been removed.`)
        .addFields({ name: "User ID", value: member.user.id, inline: true })
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setTimestamp()
        .setFooter({ text: "Member Log", iconURL: member.guild.iconURL() });

    await logChannel.send({ embeds: [embed] });
}

async function handleMemberKick(member) {
    const logChannel = member.guild.channels.cache.find(c => c.name === "member-log" && c.type === ChannelType.GuildText);
    if (!logChannel) return;

    const auditLogs = await member.guild.fetchAuditLogs({ type: 20, limit: 1 }); // 20 = MEMBER_KICK
    const logEntry = auditLogs.entries.first();
    if (!logEntry || logEntry.target.id !== member.id) return; // Ensure the entry is about this user

    const reason = logEntry.reason || "No reason provided";
    const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("🚪 Member Kicked")
        .setDescription(`**${member.user.tag}** was kicked from the server.`)
        .addFields(
            { name: "User ID", value: member.user.id, inline: true },
            { name: "Reason", value: reason, inline: true }
        )
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setTimestamp()
        .setFooter({ text: "Member Log", iconURL: member.guild.iconURL() });

    await logChannel.send({ embeds: [embed] });
}

// ✅ Export functions properly
module.exports = { 
    createMemberLogChannel, 
    handleMemberUpdate, 
    handleMemberBan, 
    handleMemberUnban, 
    handleMemberTimeout, 
    handleRemoveTimeout,
    handleMemberKick
};
