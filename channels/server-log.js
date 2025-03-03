const { EmbedBuilder, ChannelType, PermissionsBitField } = require('discord.js');

async function createServerLogChannel(guild, category) {
    let channel = guild.channels.cache.find(c => c.name === "server-log");
    if (!channel) {
        channel = await guild.channels.create({
            name: "server-log",
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

async function logServerEvent(guild, title, description, color = "Blue") {
    const logChannel = guild.channels.cache.find(c => c.name === "server-log" && c.type === ChannelType.GuildText);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(description)
        .setTimestamp()
        .setFooter({ 
            text: "Server Log", 
            iconURL: guild.iconURL({ dynamic: true }) || null 
        });

    await logChannel.send({ embeds: [embed] });
}

async function handleChannelCreate(channel) {
    if (!channel.guild) return;

    // Map channel type to a readable name
    const channelTypes = {
        0: "Text Channel",
        2: "Voice Channel",
        4: "Category",
        5: "Announcement Channel",
        10: "Thread (Public)",
        11: "Thread (Private)",
        12: "Thread (News)",
        13: "Stage Channel",
        15: "Forum Channel"
    };

    const typeName = channelTypes[channel.type] || "Unknown Channel";

    await logServerEvent(
        channel.guild,
        "Channel Created",
        `**Name:** ${channel.name}\n**Type:** ${typeName}`,
        "Green"
    );
}

async function handleChannelUpdate(oldChannel, newChannel) {
    if (!oldChannel.guild) return;
    await logServerEvent(oldChannel.guild, "Channel Updated", `**Old Name:** ${oldChannel.name}\n**New Name:** ${newChannel.name}`, "Orange");
}

async function handleChannelDelete(channel) {
    if (!channel.guild) return;
    await logServerEvent(channel.guild, "Channel Deleted", `**Name:** ${channel.name}`, "Red");
}

// 📌 Role Events
async function handleRoleCreate(role) {
    if (!role || !role.guild) return;
    
    await logServerEvent(
        role.guild, 
        "Role Created", 
        `**Role Name:** ${role.name}\n**Role ID:** ${role.id}`, 
        "Green"
    );
}

async function handleRoleUpdate(oldRole, newRole) {
    if (!oldRole || !newRole || !oldRole.guild) return;

    let changes = [];

    if (oldRole.name !== newRole.name) {
        changes.push(`**Name:** \`${oldRole.name}\` → \`${newRole.name}\``);
    }
    if (oldRole.color !== newRole.color) {
        changes.push(`**Color:** \`${oldRole.color}\` → \`${newRole.color}\``);
    }
    if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) {
        changes.push(`**Permissions Changed**`);
    }

    if (changes.length === 0) return; // No changes detected

    await logServerEvent(
        newRole.guild, 
        "Role Updated", 
        changes.join("\n"), 
        "Orange"
    );
}


async function handleRoleDelete(role) {
    await logServerEvent(role.guild, "Role Deleted", `**Role:** ${role.name}`, "Red");
}

async function handleGuildUpdate(oldGuild, newGuild) {
    if (oldGuild.name !== newGuild.name) {
        await logServerEvent(newGuild, "Server Name Updated", `**Old Name:** ${oldGuild.name}\n**New Name:** ${newGuild.name}`, "Blue");
    }
}

// 📌 Emoji Changes
async function handleEmojiUpdate(emoji) {
    await logServerEvent(emoji.guild, "Emoji Updated", `**Emoji:** ${emoji.toString()}`, "Yellow");
}

module.exports = {
    createServerLogChannel,  
    handleChannelCreate, 
    handleChannelUpdate, 
    handleChannelDelete, 
    handleRoleCreate, 
    handleRoleUpdate, 
    handleRoleDelete, 
    handleGuildUpdate, 
    handleEmojiUpdate
};
