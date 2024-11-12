const { MessageContext, InlineKeyboardBuilder } = require('puregram');

const adminMenu = async (context) => {
    let messageParams = {
        parse_mode: "Markdown",
        reply_markup: new InlineKeyboardBuilder()
            .textButton({ text: '📊 Статистика', payload: { command: 'statistics' } }).row()
    };

    let text = `Админ-Меню`;

    if (context instanceof MessageContext) {
        await context.send(text, messageParams);
    } else {
        await context.message.editMessageText(text, messageParams);
    }
};

module.exports = {
    execute: adminMenu,
    access: 'admin'
};
