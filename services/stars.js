const {
    InlineKeyboard,
    Telegram,
    InlineKeyboardBuilder,
    MessageContext,
    Markdown,
    MediaSource
} = require('puregram');

const axios = require('axios');

require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const url = `https://api.telegram.org/bot${token}/createInvoiceLink`;

async function createInvoiceLink(orderId, stars) {

    const data = {
        title: 'Premium Subscription',
        payload: orderId,
        description: 'Premium Subscription',
        provider_token: '',
        currency: 'XTR',
        prices: [{
            label: 'premium',
            amount: 50
        }]
      };

      let finalUrl = await axios.post(url, data);

    return finalUrl.data.result;
}

module.exports = {
    createInvoiceLink
}