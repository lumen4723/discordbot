import { tftest1, tftest2, tftest3 } from "./tf_cmd.js";
// const { EmbedBuilder } = require('discord.js');
import discord from 'discord.js';
const { EmbedBuilder } = discord;

const dict = [
    {"key": "알로항", "value": "알로항"},
    {"key": "민우", "value": "오니쨩"},
    {"key": "사랑해", "value": "나두 사랑해"},
    {"key": "AI", "value": "저는 그래픽 카드가 없는 찐따에유 ㅠㅠ"},
    {"key": "퉁", "value": "퉁퉁퉁퉁퉁퉁퉁퉁퉁 사후르"},
    {"key": "트", "value": "트랄라레로 트랄랄라"},
    {"key": "리", "value": "리릴리 라릴라"},
    {"key": "봄", "value": "봄바르딜로 크로코딜로"},
];

const macro_chat = (message) => {
    if (message.content === "!help") {
        let msg = "도움말: !help, !ㅋ: ㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋ,";
        dict.forEach((item) => {
            msg += `\n${item.key}: ${item.value}`;
        });

        message.reply(msg);
    }

    if (message.content.startsWith("!ㅋ")) {
        message.reply("ㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋ");
    }

    dict.forEach((item) => {
        if (message.content === item.key) {
            message.reply(item.value);
        }
    });
}

const tf_chat = (message) => {
    if (message.content === "tftest1") {
        message.reply(`${tftest1()}`);
    }

    if (message.content === "tftest2") {
        tftest2().then((result) => {
            message.reply(`${result}`);
        });
    }

    if (message.content === "tftest3") {
        tftest3().then((result) => {
            message.reply(`결과: ${JSON.stringify(result)}`);
        });
    }

    if (message.content === "tftest4") {
        tftest3().then((result) => {
            const embed = new EmbedBuilder()
                .setTitle("Car Data (First 5 Cars)")
                .setColor('#00FF00')
                .setDescription("Here are the first 5 cars' data:")
                .addFields(
                    ...result.map((car, index) => ({
                        name: `Car ${index + 1}`,
                        value: `**MPG:** ${car.mpg} | **Horsepower:** ${car.horsepower}`,
                        inline: true
                    }))
                );
    
            message.reply({ embeds: [embed] });
        });
    }

}

export { macro_chat, tf_chat };
