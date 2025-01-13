import { tftest1, tftest2, tftest3 } from "./tf_cmd.js";
// const { EmbedBuilder } = require('discord.js');
import discord from 'discord.js';
const { EmbedBuilder } = discord;

const macro_chat = (message) => {
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

    if (message.content === "AI") {
        message.reply("저는 그래픽 카드가 없는 찐따에유 ㅠㅠ");
    }
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
