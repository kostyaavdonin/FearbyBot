const { MessageContext, InlineKeyboardBuilder } = require("puregram");
const { getUser } = require("../../services/userService");

require('dotenv').config();

const privacyCommand = async (context) => {

    let user = await getUser(context.from.id).catch(error => console.log(error));

    let messageParams = {
        parse_mode: "HTML",
        reply_markup: new InlineKeyboardBuilder()
            .textButton({ text: context.i18n.__("back"), payload: { command: 'start' } }).row()
    };

    let text = context.i18n.__("privacy", { userToken: user.userToken, mode: ""});

    if (context instanceof MessageContext) {
        await context.send(text, messageParams);
    } else {
        try {
            await context.message.editMessageText(text, messageParams);
        } catch (error) {
            console.error("Ошибка при редактировании сообщения:", error);
            await context.send(text, messageParams);
        }
    }
};

module.exports = {
    execute: privacyCommand 
};
