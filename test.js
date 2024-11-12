require('dotenv').config();

const {
    InlineKeyboard,
    Telegram,
    InlineKeyboardBuilder,
    MessageContext,
    Markdown,
    MediaSource,
    KeyboardBuilder
} = require('puregram');

const telegram = Telegram.fromToken(process.env.TELEGRAM_BOT_TOKEN);

async function main() {
    console.log(await telegram.api.setMyName({
        name: "Fearby - Foto melalui tautan, lelucon",
        language_code: "id"
    }))
}

main()