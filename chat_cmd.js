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
}

export { macro_chat };
