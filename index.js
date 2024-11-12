const {
    InlineKeyboard,
    Telegram,
    InlineKeyboardBuilder,
    MessageContext,
    Markdown,
    MediaSource,
    KeyboardBuilder
} = require('puregram');

const {
    HearManager
} = require("@puregram/hear");

const { session } = require('@puregram/session');
const hearManager = new HearManager();

const RateLimiter = require('async-ratelimiter');

require('dotenv').config();
require("./server/server");

const supportedLanguages = ['en', 'ru', 'id', 'ar', 'fr'];

const HiViews = require('./services/hiviews');
const Flyer = require('./services/flyer');

const hiviews = new HiViews({ 
    token: process.env.HIVIEWS_TOKEN
})
  
const flyer = new Flyer({
    token: process.env.FLYER_TOKEN, 
});

const adminIds = process.env.ADMINS.split(',').map(id => parseInt(id.trim()));

let {
    SceneManager,
    StepScene
} = require('@puregram/scenes');

const { resolve } = require('path');
const { I18n } = require('@starkow/i18n');

let options = {
    localesPath: resolve(__dirname, 'locales'),
    currentLocale: 'en',
    defaultLocale: 'en',
    throwOnFailure: true,
};

let sceneManager = new SceneManager();

let scenes = require('./scenes');

for (let scene of Object.values(scenes)) {
    sceneManager.addScenes([scene])
};

const db = require("./database/db/db");
const command = require("./commands/command");
const redis = require('./redis/redis');
const { registerUser, getUser, updateUser } = require('./services/userService');
const { User } = require('./database/models');

const telegram = Telegram.fromToken(process.env.TELEGRAM_BOT_TOKEN);

const limiter = new RateLimiter({
    db: redis,
    max: 3,
    duration: 1000
});

telegram.updates.use(session({
    initial: () => ({ counter: 0 })
}))

telegram.updates.on("callback_query", sceneManager.middleware);
telegram.updates.on("callback_query", sceneManager.middlewareIntercept);

telegram.updates.on('pre_checkout_query', async (context) => {

    context.i18n = new I18n(options);

    context.i18n.locale = supportedLanguages.includes(context.from.languageCode) ? context.from.languageCode : 'en';

    let invoicePayload = context.invoicePayload;
    let userId = context.from.id;
    let stars = context.totalAmount;

    await telegram.api.answerPreCheckoutQuery({
        ok: true,
        pre_checkout_query_id: context.id
    })

    let user = await getUser(userId);

    const currentDate = new Date();
        currentDate.setDate(currentDate.getDate() + 3);

    user.subscriptionDate = currentDate;

    try {
        await telegram.api.sendMessage({
            chat_id: userId,
            text: context.i18n.__("paymentSent"),
            parse_mode: "HTML",
        });
    } catch (error) {
        console.log(error)
    }

    await Promise.all([
        User.update(user, {
            where: {
                tgId: userId
            }
        }).catch(console.error),
    ]);

    await telegram.api.sendMessage({
        chat_id: process.env.PAYMENTS_CHAT,
        text: `
🚀 *Новый платёж!*

🆔 *TGID пользователя:* \`${user.tgId}\`
👤 *Пользователь:* [${user.firstName}](${user.username !== '' ? `@${user.username}` : `tg://user?id=${user.tgId}`})
💵 *Сумма:* \`${stars}\`
ℹ️ *Реф:* \`${user.invitedBy}\`

🧾 *Оплачено через Telegram Stars.*

        `,
        parse_mode: "Markdown",
        disable_web_page_preview: true
    }).catch(error => console.log(error))
})

telegram.updates.on('message', async (context, next) => {
  
    const limit = await limiter.get({ id: context.from.id });

    if (limit.remaining === 0) return;

    /*if (context.from.isPremium()) {
        console.log(`Premium override: ${context.from.id} / ${context.from.languageCode}`)
        return context.send('🔘 Click the button if you are not a robot.', {
            reply_markup: new InlineKeyboardBuilder()
            .textButton({
                text: "🔘",
                payload: {
                    command: 'not_are_robot',
                }
            }).row(),
        });
    }*/

    context.i18n = new I18n(options);

    context.i18n.locale = supportedLanguages.includes(context.from.languageCode) ? context.from.languageCode : 'en';

    if(context.text === "/start") {
     
        try {
            await hiviews.sendMessage({ 
                UserFirstName: context.from.firstName ?? '', 
                UserId: context.from.id, 
                MessageId: context.id, 
                LanguageCode: context.from.languageCode,
                StartPlace: true
            }).then(() => sleep(500)).catch(() => {});
        } catch (error) {
            console.log(error)
        }
    }

    let user = await getUser(context.from.id).catch(error => console.log(error));

    if (!user) {

        try {
            await registerUser(context, context.from.id);
            return command.execute(context, "start");
        } catch (error) {
            console.log(error)
        }

        try {
            await telegram.api.sendMessage({
                text: `premium: ${context.from.isPremium() === undefined ? "нет" : "да"}\n\ntgId: ${context.from.id}\nname: ${context.from.firstName}\nusername: ${context.from.username == undefined ? 'none' : 't.me/' + context.from.username}\nlanguage: ${context.from.languageCode}\n\npayload: ${context.startPayload}`,
                chat_id: process.env.REGISTRATIONS
            })
        } catch (error) {
            //console.log(error)
        }
    }

    let isSubscribed = await checkUser(context.from.id, context.from.language_code);
    const isAdmin = adminIds.includes(context.from.id);

    if (!isSubscribed && !isAdmin) {
        await context.send(context.i18n.__("subscription"), { parse_mode: "HTML" });
        return;
    }

    
    if(context.startPayload) {
        return command.execute(context, "start");
    }
    return next();
});

telegram.updates.on('callback_query', async (context, next) => {
    let user = await getUser(context.from.id).catch(error => console.log(error));


    if (!user) {
        try {
            await registerUser(context, context.from.id);
            return command.execute(context, "start");
        } catch (error) {
            console.log(error)
        }

        try {
            await telegram.api.sendMessage({
                text: `premium: ${context.from.isPremium() === undefined ? "нет" : "да"}\n\ntgId: ${context.from.id}\nname: ${context.from.firstName}\nusername: ${context.from.username == undefined ? 'none' : 't.me/' + context.from.username}\nlanguage: ${context.from.languageCode}\n\npayload: ${context.startPayload}`,
                chat_id: process.env.REGISTRATIONS
            })
        } catch (error) {
            //console.log(error)
        }
    }

    context.i18n = new I18n(options);

    context.i18n.locale = supportedLanguages.includes(context.from.languageCode) ? context.from.languageCode : 'en';

    const commandName = context.queryPayload.command;

    if(commandName === "not_are_robot") {
        return command.execute(context, "start")
    }

    if(commandName === "complaint") {
        return Promise.all([
            context.answerCallbackQuery({ text: context.i18n.__("complaintSent"), show_alert: true }),
            context.message.delete()
        ]);
    } else if(commandName === "exchange") {
        if(user.points <= 9) return context.answerCallbackQuery({ text: context.i18n.__("exchange.enoughtPoints"), show_alert: true });

        const currentDate = new Date();
            currentDate.setDate(currentDate.getDate() + 1);

        let updatedPoints = user.points - 10;
        return Promise.all([
            context.message.delete().catch(error => console.log(error)),
            context.answerCallbackQuery({ text: "♻️" }).catch(error => console.log(error)),
            context.message.send(context.i18n.__("exchange.text"), { parse_mode: "HTML", reply_markup: new InlineKeyboardBuilder() .textButton({ text: context.i18n.__("back"), payload: { command: 'start' } }).row() }).catch(error => console.log(error)),
            updateUser(context.from.id, { points: updatedPoints, subscription: currentDate }).catch(error => console.log(error)),
        ]);
    } else if (commandName === "changeCamera") {
        if (context.session.mode === undefined) {
            context.session.mode = 1;
        } else {
            context.session.mode = context.session.mode === 1 ? 2 : 1;
        }
        return command.execute(context, "start");
    }
    
    if (!commandName) {
        await context.answerCallbackQuery({ text: context.i18n.__("commandNotFound"), show_alert: true });
        return;
    }
    try {
        await command.execute(context, commandName, context.queryPayload);
    } catch (error) {
        console.log(error)
    }
});

telegram.updates.on('message', hearManager.middleware);

hearManager.hear((text, context) => text === '/start', async (context) => {
    return command.execute(context, "start");
});

hearManager.hear((text, context) => text === '/admin', async (context) => {
    return command.execute(context, "admin");
});

async function main() {
    await db.authenticate().then(console.log("PG connected!")).catch(error => console.error(error));

    await telegram.updates.startPolling().then(console.log('bot started!'));
};
  
main();

async function checkUser(userId, languageCode) {
    try {
        const shouldSkip = await flyer.check(userId, languageCode);
        return shouldSkip;
    } catch (error) {
        console.error('Error checking user:', error);
        return false;
    }
}