const { MessageContext, InlineKeyboardBuilder } = require("puregram");
const { getUser } = require("../../services/userService");
const { isVip } = require("../../utils/helpers");

require('dotenv').config();

const startCommand = async (context) => {

    let user = await getUser(context.from.id)

    let mode = "";
    let cameraText = "";

    let keyboard = new InlineKeyboardBuilder()
        .textButton({ text: context.i18n.__("start.keyboard.getPremium"), payload: { command: 'premium' } }).row()
        .textButton({ text: context.i18n.__("start.keyboard.privacy"), payload: { command: 'privacy' } }).row()
        .urlButton({ text: context.i18n.__("start.keyboard.sharelink"), url: `tg://msg_url?url=https://tiktok.fearby.su/?video=${user.userToken}` }).row()

    if(isVip(user)) {
        mode = `&m=${context.session.mode || 1}`;
        cameraText = mode === "&m=1" ?  context.i18n.__("start.frontCamera") : context.i18n.__("start.rearCamera");

        keyboard.textButton({ text: context.i18n.__("start.keyboard.changeCamera"), payload: { command: 'changeCamera' } }).row()
    }

    let messageParams = {
        parse_mode: "HTML",
        reply_markup: keyboard,
        link_preview_options: {
            is_disabled: true
        }
    };

    let text = context.i18n.__("start.text", { userToken: user.userToken, mode, cameraText });

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
    execute: startCommand 
};
