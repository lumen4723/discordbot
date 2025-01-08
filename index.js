const { Client, Events, GatewayIntentBits } = require("discord.js");
const { token } = require("./config.json");
const {
    StreamType,
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
} = require("@discordjs/voice");

const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const queue = [];
let currentPlayer = null; // 현재 재생 중인 플레이어 상태
let isPlaying = false; // 재생 중인지 여부

const downloadNext = async () => {
    if (queue.length === 0) { return; } // 대기열이 비어있으면 다운로드 중지

    const nextTrack = queue.find((track) => !track.downloaded);
    if (!nextTrack) { return; } // 모든 항목이 다운로드 완료됨

    const { url, audioPath } = nextTrack;
    nextTrack.downloading = true;

    const ytDlpCommand = `yt-dlp -x --audio-format mp3 -o "${audioPath}" ${url}`;
    exec(ytDlpCommand, (error, stdout, stderr) => {
        if (error) {
            console.error("yt-dlp 실행 중 오류 발생:", error);
            nextTrack.error = true; // 오류 상태 표시
        }
        else {
            nextTrack.downloaded = true; // 다운로드 완료 상태 표시
        }
        nextTrack.downloading = false;

        playNext();
        downloadNext(); // 다음 항목 다운로드
    });
};

const playNext = async () => {
    if (isPlaying || queue.length === 0) { return; } // 현재 재생 중이거나 대기열이 비어 있으면 재생 중지

    const nextTrack = queue[0];
    if (!nextTrack.downloaded) { return; } // 다음 트랙이 아직 다운로드되지 않았으면 대기

    const { voiceChannel, audioPath, requestedBy } = nextTrack;

    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    const resource = createAudioResource(audioPath, {
        inputType: "arbitrary",
    });

    const player = createAudioPlayer();
    connection.subscribe(player);
    player.play(resource);

    currentPlayer = { player, connection, audioPath };
    isPlaying = true;

    player.on(AudioPlayerStatus.Idle, () => {
        connection.destroy();
        if (
            currentPlayer?.audioPath
            && fs.existsSync(currentPlayer.audioPath)
        ) {
            fs.unlinkSync(currentPlayer.audioPath); // 파일 삭제
        }
        queue.shift(); // 대기열에서 제거
        currentPlayer = null;
        isPlaying = false;
        playNext(); // 다음 곡 재생
    });

    player.on("error", (error) => {
        console.error("오디오 플레이어 에러:", error);
        connection.destroy();
        if (fs.existsSync(audioPath)) {
            fs.unlinkSync(audioPath);
        }
        queue.shift(); // 대기열에서 제거
        currentPlayer = null;
        isPlaying = false;
        playNext(); // 다음 곡 재생
    });

    // client.channels.cache
    //     .get(voiceChannel.id)
    //     ?.send(`🎶 **${requestedBy}** 님의 요청곡을 재생합니다!`);
};

const stopProcess = () => {
    if (!currentPlayer) { return false; }

    const { player, connection, audioPath } = currentPlayer;

    player.stop(); // 재생 중지
    connection.destroy(); // 음성 채널 연결 종료
    if (fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath); // 다운로드된 파일 삭제
    }
    currentPlayer = null; // 현재 플레이어 초기화
    return false;
};

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
    ],
});

client.once(Events.ClientReady, (readyClient) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on("messageCreate", async (message) => {
    if (message.author.bot) { return; } // 봇의 메시지는 무시

    if (message.content === "/test") {
        // 사용자가 음성 채널에 있는지 확인
        const voiceChannel = message.member?.voice.channel;
        if (!voiceChannel) {
            message.reply("먼저 음성 채널에 들어가 주세요!");
            return message.delete();
        }

        // 음성 채널에 연결
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });

        // 오디오 파일 재생 준비
        const audioPath = path.join(__dirname, "./mp3/test.mp3");
        const resource = createAudioResource(audioPath, {
            inputType: StreamType.Arbitrary,
        });

        const player = createAudioPlayer();
        connection.subscribe(player);
        player.play(resource);

        player.on(AudioPlayerStatus.Idle, () => {
            connection.destroy(); // 재생 완료 후 연결 종료
        });

        player.on("error", (error) => {
            console.error("오디오 플레이어 에러:", error);
            connection.destroy();
        });

        message.reply("test.mp3 파일을 재생합니다!");
    }

    if (message.content.startsWith("/p")) {
        const args = message.content.split(" ");
        const url = args[1]; // /p <URL> 형식으로 입력받음

        if (!url) {
            message.reply( "유튜브 URL을 입력해주세요! 형식: `/p <유튜브 URL>`" );
            return message.delete();
        }

        const voiceChannel = message.member?.voice.channel;
        if (!voiceChannel) {
            message.reply("먼저 음성 채널에 들어가 주세요!");
            return message.delete();
        }

        const hash = crypto
            .createHash("md5")
            .update(url + Math.random())
            .digest("hex");
        const audioPath = path.join(__dirname, `./mp3/${hash}.mp3`);

        // 대기열에 추가
        queue.push({
            url,
            voiceChannel,
            audioPath,
            requestedBy: message.author.username,
            downloaded: false,
            downloading: false,
            error: false,
        });

        message.reply(
            `음원이 대기열에 추가되었습니다. 현재 대기열: ${queue.length}`
        );
        if (queue.length === 1) {
            message.reply(`처음 실행시에는 시간이 다소 걸릴 수 있습니다`);
        }

        downloadNext();
        playNext();
    }

    if (message.content === "/stop") {
        if (!isPlaying) { 
            message.reply("현재 재생 중인 음원이 없습니다.");
            return message.delete();
        }

        isPlaying = stopProcess();
        message.reply("음원 재생을 중지했습니다.");
    }

    if (message.content === "/next") {
        if (queue.length === 0) { 
            message.reply("대기열에 더 이상 재생할 곡이 없습니다.");
            return message.delete();
        }

        if (currentPlayer) { isPlaying = stopProcess(); }

        queue.shift(); // 대기열에서 현재 곡 제거
        message.reply("다음 곡을 재생합니다.");
        playNext(); // 다음 곡 재생
    }

    if (message.content === "/clear") {
        if (isPlaying || queue.length > 0) {
            // 현재 재생 중인 트랙 정지
            if (currentPlayer) { isPlaying = stopProcess(); }

            // 대기열 초기화
            queue.forEach((track) => {
                if (fs.existsSync(track.audioPath)) {
                    fs.unlinkSync(track.audioPath); // 다운로드된 파일 삭제
                }
            });
            queue.length = 0;

            message.reply("모든 대기열을 비우고 현재 작업을 중지했습니다.");
        }
        else {
            message.reply("대기열이 비어있고 재생 중인 음원이 없습니다.");
        }
    }

    if (message.content === "/go") {
        if (isPlaying) {
            message.reply("현재 곡이 이미 재생 중입니다.");
            return message.delete();
        }

        if (queue.length === 0) {
            message.reply("대기열에 재생할 곡이 없습니다.");
            return message.delete();
        }

        message.reply("현재 곡을 재생합니다.");
        playNext(); // 대기열에서 다음 곡 실행
    }

    if (message.content.startsWith("/")) {
        setTimeout(async () => { await message.delete(); }, 5000);
    }

    if (message.content === "알로항") {
        message.reply("알로항");
    }

    if (message.content === "민우") {
        message.reply("오니쨩");
    }

    if (message.content === "사랑해") {
        message.reply("나두 사랑해");
    }

    if (message.content.startsWith("ㅋ")) {
        message.reply("ㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋ");
    }
});

client.login(token);
