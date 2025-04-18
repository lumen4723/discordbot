import { Client, Events, GatewayIntentBits } from "discord.js";
import fs from "fs";
const config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
const token = config.token;

import {
    music_test, music_play, music_go,
    music_stop, music_next, music_clear
} from "./music_cmd.js";
import { macro_chat, tf_chat } from "./chat_cmd.js";

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

    if (message.content === "/test") { music_test(message); }
    else if (message.content.startsWith("/p")) { music_play(message); }
    else if (message.content === "/go") { music_go(message); }
    else if (message.content === "/stop") { music_stop(message); }
    else if (message.content === "/next") { music_next(message); }
    else if (message.content === "/clear") { music_clear(message); }
    else {
        macro_chat(message);
        tf_chat(message);
        return;
    }

    setTimeout(async () => { await message.delete(); }, 5000);
});

client.login(token);
