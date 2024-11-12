const { MessageContext, InlineKeyboardBuilder } = require("puregram");
const { getUser } = require("../../services/userService");
const { createInvoiceLink } = require("../../services/stars");

require('dotenv').config();

const { randomBytes } = require('crypto');
const { Payment } = require("../../database/models");

const premiumCommand = async (context) => {

    let orderId = randomBytes(32 / 2).toString('hex');

    await Payment.create({
        tgId: context.from.id,
        paymentSent: new Date(),
        amount: 50
    });

    let invoiceLink = await createInvoiceLink(orderId, 50);
    
    let messageParams = {
        parse_mode: "HTML",
        reply_markup: new InlineKeyboardBuilder()
            .urlButton({ text: context.i18n.__("premium.keyboard.pay"), url: invoiceLink }).row()
            .textButton({ text: context.i18n.__("premium.keyboard.getForFree"), payload: { command: 'referral' } }).row()
            .textButton({ text: context.i18n.__("back"), payload: { command: 'start' } }).row()
    };

    let text = context.i18n.__("premium.text");

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
    execute: premiumCommand 
};
