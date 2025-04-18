import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));

import { createHash } from "crypto";
import { existsSync, unlinkSync } from "fs";
import { exec } from "child_process";
import {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    StreamType
} from "@discordjs/voice";

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
            && existsSync(currentPlayer.audioPath)
        ) {
            unlinkSync(currentPlayer.audioPath); // 파일 삭제
        }
        queue.shift(); // 대기열에서 제거
        currentPlayer = null;
        isPlaying = false;
        playNext(); // 다음 곡 재생
    });

    player.on("error", (error) => {
        console.error("오디오 플레이어 에러:", error);
        connection.destroy();
        if (existsSync(audioPath)) {
            unlinkSync(audioPath);
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
    if (existsSync(audioPath)) {
        unlinkSync(audioPath); // 다운로드된 파일 삭제
    }
    currentPlayer = null; // 현재 플레이어 초기화
    return false;
};

const music_test = async (message) => {
    // 사용자가 음성 채널에 있는지 확인
    const voiceChannel = message.member?.voice.channel;
    if (!voiceChannel) {
        return message.reply("먼저 음성 채널에 들어가 주세요!");
    }

    // 음성 채널에 연결
    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    // 오디오 파일 재생 준비
    const audioPath = join(__dirname, "./mp3/test.mp3");
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

const music_play = async (message) => {
    const args = message.content.split(" ");
    const url = args[1];

    if (!url) {
        return message.reply("현재 재생 중인 음원이 없습니다.");
    }

    const voiceChannel = message.member?.voice.channel;
    if (!voiceChannel) {
        return message.reply("먼저 음성 채널에 들어가 주세요!");
    }

    const hash = createHash("md5").update(url + Math.random()).digest("hex");
    const audioPath = join(__dirname, `./mp3/${hash}.mp3`);

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
        + `${
            queue.length === 1 ? "\n처음 실행시에는 시간이 다소 걸릴 수 있습니다." : ""
        }`
    );

    downloadNext();
    playNext();
}

const music_go = (message) => {
    if (isPlaying) {
        return message.reply("현재 곡이 이미 재생 중입니다.");
    }

    if (queue.length === 0) {
        return message.reply("대기열에 재생할 곡이 없습니다.");
    }

    message.reply("현재 곡을 재생합니다.");
    playNext(); // 대기열에서 다음 곡 실행
}

const music_stop = (message) => {
    if (!isPlaying) {
        return message.reply("현재 재생 중인 음원이 없습니다.");
    }

    isPlaying = stopProcess();
    message.reply("음원 재생을 중지했습니다.");
}

const music_next = (message) => {
    if (queue.length === 0) {
        return message.reply("대기열에 더 이상 재생할 곡이 없습니다.");
    }

    if (currentPlayer) { isPlaying = stopProcess(); }

    queue.shift();
    message.reply("다음 곡을 재생합니다.");
    playNext();
}

const music_clear = (message) => {
    if (isPlaying || queue.length > 0) {
        if (currentPlayer) { isPlaying = stopProcess(); }

        queue.forEach((track) => {
            if (existsSync(track.audioPath)) {
                unlinkSync(track.audioPath);
            }
        });
        queue.length = 0;

        message.reply("모든 대기열을 비우고 현재 작업을 중지했습니다.");
    }
    else {
        message.reply("대기열이 비어있고 재생 중인 음원이 없습니다.");
    }
}

export {
    music_test, music_play, music_go,
    music_stop, music_next, music_clear
}
