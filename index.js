require('dotenv').config();
const { 
    Client, 
    GatewayIntentBits, 
    PermissionsBitField, 
    REST, 
    Routes, 
    SlashCommandBuilder,
    ChannelType,
    EmbedBuilder
} = require('discord.js');


const { createMemberLogChannel }= require('./channels/member-log');
const { createServerLogChannel } = require('./channels/server-log');
const { createVoiceLogChannel } = require('./channels/voice-log');
const { createMsgLogChannel } = require('./channels/msg-log');
const { createUserLogChannel } = require('./channels/user-log');
const { handleMemberUpdate } = require('./channels/member-log');
const { handleVoiceLog } = require('./channels/voice-log');
const { handleUserLog } = require('./channels/user-log');
const { handleMessageLog, handleMessageEdit, handleMessageDelete } = require('./channels/msg-log');

// ✅ Importing new server-log handlers
const { 
    handleChannelCreate, 
    handleChannelUpdate, 
    handleChannelDelete, 
    handleRoleCreate, 
    handleRoleUpdate, 
    handleRoleDelete, 
    handleGuildUpdate, 
    handleEmojiUpdate 
} = require('./channels/server-log');

const {   
    handleMemberBan, 
    handleMemberUnban, 
    handleMemberTimeout, 
    handleRemoveTimeout 
} = require('./channels/member-log');




const client = new Client({ intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildBans
] });

client.once('ready', async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);

    client.user.setPresence({
        activities: [{
            name: "Everying in the Servers",
            type: 3 // Type 3 = Watching
        }],
        status: 'online' // Options: 'online', 'idle', 'dnd', 'invisible'
    });

    // Register the modsetup slash command
    const commands = [
        new SlashCommandBuilder()
            .setName('lohelp')
            .setDescription('Provides a brief about the bot logging duties.'),
        

        new SlashCommandBuilder()
            .setName('modsetup')
            .setDescription('Creates a Moderation category with 6 text channels.')
    ].map(cmd => cmd.toJSON());

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
    try {
        await rest.put(Routes.applicationCommands(process.env.BOT_ID), { body: commands });
        console.log("✅ Slash command /modsetup registered globally!");
    } catch (error) {
        console.error("❌ Error registering command:", error);
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'lohelp') {
        const embed = new EmbedBuilder()
            .setColor('Blue')
            .setTitle('📜 Bot Logging Duties')
            .setDescription("The bot helps track server activities efficiently. Here’s what it logs:")
            .addFields(
                { name: "Channel Logs", value: "Tracks channel creation, updates, and deletions.", inline: false },
                { name: "Role Logs", value: "Monitors role additions, updates, and removals.", inline: false },
                { name: "Member Logs", value: "Logs member joins, leaves, bans, and unbans.", inline: false },
                { name: "Message Logs", value: "Detects message edits and deletions.", inline: false },
                { name: "Voice Logs", value: "Keeps track of voice channel activity.", inline: false }
            )
            .setFooter({ text: "Use /modsetup to set up log channels!" });

        await interaction.reply({ embeds: [embed] });
    }

    if (interaction.commandName === 'modsetup') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return interaction.reply({ 
                content: '❌ You need **Manage Channels** permission!', 
                ephemeral: true 
            });
        }

        const { MessageFlags } = require('discord.js');

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
 

        try {
            const guild = interaction.guild;

            let category = guild.channels.cache.find(c => c.name === "Moderation" && c.type === ChannelType.GuildCategory);
            if (!category) {
                category = await guild.channels.create({
                    name: 'Moderation',
                    type: ChannelType.GuildCategory,
                });
            }

            await createMemberLogChannel(guild, category);
            await createServerLogChannel(guild, category);
            await createVoiceLogChannel(guild, category);
            await createMsgLogChannel(guild, category);
            await createUserLogChannel(guild, category);

            await interaction.editReply({ content: '✅ Moderation setup complete!' });
        
        } catch (error) {
            console.error("❌ Error creating channels:", error);
            await interaction.editReply({ content: '❌ Failed to set up moderation channels.' });
        }
    }
});

// ✅ Server Log Event Handlers (Embed Logging)
client.on('channelCreate', async (channel) => {
    await handleChannelCreate(channel);
});

client.on('channelUpdate', async (oldChannel, newChannel) => {
    await handleChannelUpdate(oldChannel, newChannel);
});

client.on('channelDelete', async (channel) => {
    await handleChannelDelete(channel);
});

client.on('roleCreate', async (role) => {
    try {
        await handleRoleCreate(role);
    } catch (error) {
        console.error("❌ Error in roleCreate:", error);
    }
});


client.on('roleUpdate', async (oldRole, newRole) => {
    await handleRoleUpdate(oldRole, newRole);
});

client.on('roleDelete', async (role) => {
    await handleRoleDelete(role);
});

client.on('guildUpdate', async (oldGuild, newGuild) => {
    await handleGuildUpdate(oldGuild, newGuild);
});

client.on('emojiUpdate', async (emoji) => {
    await handleEmojiUpdate(emoji);
});

// ✅ Voice Log Event
client.on('voiceStateUpdate', async (oldState, newState) => {
    handleVoiceLog(oldState, newState); 
});

// ✅ Member Logs
client.on('guildMemberAdd', async (member) => {
    try {
        await handleUserLog(member, "joined");
    } catch (error) {
        console.error("❌ Error in guildMemberAdd:", error);
    }
});

client.on('guildMemberRemove', async (member) => {
    try {
        await handleUserLog(member, "left");
    } catch (error) {
        console.error("❌ Error in guildMemberRemove:", error);
    }
});

// ✅ Message Logs
client.on('messageCreate', async (message) => {
    if (!message.guild || message.author.bot) return; 
    
    try {
        await handleMessageLog(message);
    } catch (error) {
        console.error("❌ Error in messageCreate:", error);
    }
});

client.on('messageUpdate', async (oldMessage, newMessage) => {
    if (newMessage.author.bot || oldMessage.content === newMessage.content) return; // Ignore bot edits & identical edits
    try {
        await handleMessageEdit(oldMessage, newMessage);
    } catch (error) {
        console.error("❌ Error in messageUpdate:", error);
    }
});

client.on('messageDelete', async (message) => {
    if (!message || message.author?.bot) return; // Ensure message exists and ignore bot messages
    try {
        await handleMessageDelete(message);
    } catch (error) {
        console.error("❌ Error in messageDelete:", error);
    }
});

client.on('guildMemberUpdate', async (oldMember, newMember) => {
    await handleMemberUpdate(oldMember, newMember);
});

client.on('guildBanAdd', async (ban) => {
    await handleMemberBan(ban.guild, ban.user);
});

client.on('guildBanRemove', async (ban) => {
    await handleMemberUnban(ban.guild, ban.user);
});

client.on('guildMemberUpdate', async (oldMember, newMember) => {
    if (!oldMember.communicationDisabledUntilTimestamp && newMember.communicationDisabledUntilTimestamp) {
        await handleMemberTimeout(newMember);
    } else if (oldMember.communicationDisabledUntilTimestamp && !newMember.communicationDisabledUntilTimestamp) {
        await handleRemoveTimeout(newMember);
    }
});


client.login(process.env.DISCORD_BOT_TOKEN);
