const Discord = require('discord.js');
const http = require('http');

const maxMentionsPerRequest = 4;
const maxVoiceJobCount = 16;

const voiceJobGuilds = [];

const client = new Discord.Client();

client.on('ready', () => {
    client.user.setActivity('with @someone').catch(e => console.log(e)); // Playing with @someone
});

client.on('guildCreate', guild => {
    console.log(`Joined new guild: ${guild.name} <${guild.id}> (${guild.memberCount} members).`);

    guild.roles.fetch().then(roles => {
        if(roles.cache.find(role => role.name === 'supereveryone') != null)return;
        guild.roles.create({ data: { name: 'supereveryone' } });
        log(guild, 'Created new @supereveryone role.');
    });

    if(guild.systemChannel == null)return;
    setTimeout(() => guild.systemChannel.send('https://youtu.be/BeG5FqTpl9U').then(() => {
        guild.systemChannel.send({
            embed: {
                color: 0x738ad6,
                title: 'Someone is Here',
                author: { name: client.user.username, icon_url: client.user.avatarURL() },
                description: "👌 A Discord bot that brings back the features of April Fools' 2018.",
                fields: [
                    { name: 'Features', value: ' • 🎲 Randomly select someone at random with `@someone`.\n • 🦊 While in a voice channel, typing OwO in any text channel causes Discord to let out a cry of distress.\n • 📢 `@supereveryone` is here! You can now bypass `@everyone` permissions for when you need to say something urgent or important.' },
                    { name: 'GitHub', value: '🐙 https://github.com/rayferric/someone-is-here' }
                ]
            }
        }).catch(e => console.log(e));
    }).catch(e => console.log(e)), 1000);
});

client.on('message', message => {
    parseSomeone(message);
    parseOwo(message);
    parseSupereveryone(message);
}); 

console.log(`Logging in using token: ${process.env.TOKEN}...`),

client.login(process.env.TOKEN).then(
    () => console.log(`Logged in as ${client.user.tag}.`),
    () => {
        console.log('Failed to log in, check your internet connection and validate the bot token before trying again.');
        process.exit();
    }
);

// Glitch specific code, this server responds to Uptime Robot pings 24/7

http.createServer((reqest, result) => {
    result.writeHead(200, {'Content-Type': 'text/plain'});
    result.write('Bot status has been refreshed.');
    result.end();
}).listen(process.env.PORT);

// End of Glitch specific code

const parseSomeone = (message) => {
    let count = message.cleanContent.split('@someone').length - 1;
    if(count < 1)return
    count = Math.min(count, maxMentionsPerRequest);
    
    message.guild.members.fetch().then(members => {
        const randomMembers = members.filter(member => !member.user.bot && member.user.id !== message.author.id).random(count);
        for(const randomMember of randomMembers) {
            if(randomMember == null)break;

            message.channel.send(randomMember.user.toString()).then(message => message.delete()).catch(e => console.log(e));
            log(message.guild, `Mentioned ${randomMember.user.tag} <${randomMember.user.id}> in reply to ${message.author.tag} <${message.author.id}>.`);
        }
    }).catch(e => console.log(e));
}

const parseOwo = (message) => {
    const voiceChannel = message.member.voice.channel;
    if(voiceChannel == null)return;

    const isOwo = message.cleanContent.toLowerCase().split(/[^A-Za-z]/).includes('owo');
    if(!isOwo)return;

    if(voiceJobGuilds.length >= maxVoiceJobCount) {
        log(message.guild, 'Refused to stream audio - all voice jobs are active.');
        return;
    }
    if(voiceJobGuilds.includes(message.guild)) {
        log(message.guild, 'Refused to stream audio - already playing in this guild.');
        return;
    }
    voiceJobGuilds.push(message.guild);

    log(message.guild, 'Started streaming audio.');
    voiceChannel.join().then(connection => {
        const dispatcher = connection.play('owo.mp3');
        dispatcher.on('speaking', (speaking) => {
            if(!speaking)voiceChannel.leave()
        });
        connection.on('disconnect', () => {
            log(message.guild, 'Finished streaming audio.');
            voiceJobGuilds.splice(voiceJobGuilds.indexOf(message.guild), 1);
        });
    }).catch(e => console.log(e));
}

const parseSupereveryone = (message) => {
    if(!message.cleanContent.includes('@supereveryone'))return;
    message.channel.send('@everyone').then(message => message.delete()).catch(e => console.log(e));
    log(message.guild, `Mentioned @everyone in reply to ${message.author.tag} <${message.author.id}>.`);
}

const log = (guild, text) => {
    console.log(`[${guild.name} <${guild.id}>]: ${text}`);
}