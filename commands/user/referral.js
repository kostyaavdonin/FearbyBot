const { MessageContext, InlineKeyboardBuilder } = require("puregram");
const { getUser } = require("../../services/userService");
require('dotenv').config();

const referralCommand = async (context) => {

    let user = await getUser(context.from.id).catch(error => console.log(error));

    let messageParams = {
        parse_mode: "HTML",
        reply_markup: new InlineKeyboardBuilder()
            .textButton({ text: context.i18n.__("referral.keyboard.exchange"), payload: { command: 'exchange' } }).row()
            .urlButton({ text: context.i18n.__("start.keyboard.sharelink"), url: `tg://msg_url?url=https://t.me/${process.env.BOTNAME}?start=${context.from.id}` }).row()
            .textButton({ text: context.i18n.__("back"), payload: { command: 'premium' } }).row()
    };

    let text = context.i18n.__("referral.text", { 
        BOTNAME: process.env.BOTNAME, 
        invitesCounter: user.invitesCounter,
        points: user.points,
        tgId: context.from.id
    });

    if (context instanceof MessageContext) {
        await context.send(text, messageParams);
    } else {
        try {
            await context.message.editMessageText(text, messageParams);
        } catch (error) {
            console.error("Ошибка при редактировании сообщения:", error);
            await context.message.send(text, messageParams);
        }
    }
};

module.exports = {
    execute: referralCommand 
};
