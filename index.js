require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, StreamType } = require('@discordjs/voice');
const { spawn } = require('child_process');
const path = require('path');
const play = require('play-dl');
const { video_basic_info, stream } = require('play-dl');

process.env.PATH = `${__dirname};${process.env.PATH}`; // yt-dlp.exe 실행 경로 추가

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const queueMap = new Map();

client.once('ready', () => {
  console.log(`Log in Success : ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (!message.content.startsWith('!play') || message.author.bot) return;

  const query = message.content.slice(6).trim();
  if (!query) return message.reply('노래 제목이나 유튜브 링크를 입력해주세요.');

  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel) return message.reply('음성 채널에 들어가 주세요.');

  const guildId = message.guild.id;

  let url;
  try {
    if (query.startsWith('http')) {
      url = query;
    } else {
      // ✨ 제목으로 유튜브 검색
      // const play = require('play-dl');
      const searchResults = await play.search(query, { limit: 1 });
      if (searchResults.length === 0 || !searchResults[0].url) {
        return message.reply('유튜브에서 노래를 찾지 못했습니다.');
      }
      url = searchResults[0].url;
      console.log('[DEBUG] 검색 결과 URL:', url);
    }

    if (!queueMap.has(guildId)) {
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: guildId,
        adapterCreator: message.guild.voiceAdapterCreator,
      });

      const player = createAudioPlayer();
      connection.subscribe(player);

      queueMap.set(guildId, {
        connection,
        player,
        queue: [],
        playing: false,
      });

      player.on(AudioPlayerStatus.Idle, () => {
        console.log('노래 끝남, 다음 곡 재생 시도');
        playNext(guildId);
      });

      player.on(AudioPlayerStatus.Playing, () => {
        console.log('노래 재생 시작');
      });

      player.on('error', (error) => {
        console.error('Audio player error:', error);
        playNext(guildId);
      });
    }

    const serverQueue = queueMap.get(guildId);
    serverQueue.queue.push({ url, requester: message.author.username });

    message.reply(`재생목록에 추가됨 : ${url}`);

    if (!serverQueue.playing) {
      playNext(guildId);
    }
  } catch (err) {
    console.error('!play 처리 중 오류:', err);
    message.reply('명령어 처리 중 오류 발생!');
  }
});
/*
async function getAudioStreamUrl(videoUrl) {
  return new Promise((resolve, reject) => {
    const ytdlp = spawn(path.join(__dirname, 'yt-dlp.exe'), [
      '--no-playlist',
      '--sponsorblock-remove','all',
      '-f', 'bestaudio', '-g', videoUrl
    ]);

    let data = '';
    ytdlp.stdout.on('data', (chunk) => {
      data += chunk;
    });

    ytdlp.stderr.on('data', (err) => {
      console.error('yt-dlp stderr:', err.toString());
    });

    ytdlp.on('close', (code) => {
      if (code === 0) {
        resolve(data.trim());
      } else {
        reject(new Error(`yt-dlp exited with code ${code}`));
      }
    });
  });
}

async function playNext(guildId) {
  const serverQueue = queueMap.get(guildId);
  if (!serverQueue || serverQueue.queue.length === 0) {
    console.log('큐 비어있음, 음성 연결 종료');
    serverQueue.playing = false;
    serverQueue.connection.destroy();
    queueMap.delete(guildId);
    return;
  }

  const nextTrack = serverQueue.queue.shift();
  console.log('다음 곡 재생:', nextTrack.url);
  console.log('[DEBUG] playNext에서 꺼낸 URL:', nextTrack.url);

  try {
    const streamUrl = await getAudioStreamUrl(nextTrack.url);
    console.log('[DEBUG] yt-dlp로 얻은 stream URL:', streamUrl);

    const resource = createAudioResource(streamUrl, {
      inputType: StreamType.Arbitrary,
    });

    serverQueue.player.play(resource);
    serverQueue.playing = true;

    console.log(`Now playing: ${nextTrack.url}`);
  } catch (err) {
    console.error('노래 재생 중 오류:', err);
    playNext(guildId);
  }
}
*/

async function playNext(guildId){
  const serverQueue = queueMap.get(guildId);
  if(!serverQueue || serverQueue.queue.length === 0){
    serverQueue.playing = false;
    serverQueue.connection.destroy();
    queueMap.delete(guildId);
    return;
  }

  const nextTrack = serverQueue.queue.shift();
  try{
    console.log('[DEBUG] 재생 시작 URL:', nextTrack.url);

    const info = await video_basic_info(nextTrack.url);

    if(!info || !info.video_details || !info.video_details.url){
      console.error('video_basic_info 실패 : 유효하지 않은 정보');
      return playNext(guildId);
    }

    const streamData = await play.stream(info.video_details.url);

    const resource = createAudioResource(streamData.stream, {
      inputType: streamData.type,
    });

    serverQueue.player.play(resource);
    serverQueue.playing = true;
  } catch(err){
    console.error("노래 재생 중 오류 : ", err);
    playNext(guildId);
  }
}

client.login(process.env.DISCORD_TOKEN);
