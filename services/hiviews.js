const {
    Logger,
    Color
} = require('@starkow/logger');

const axios = require('axios');

class HiViews {
    constructor(options) {
        this.options = options;
        this.logger = Logger.create('hiviews');
    }

    async request(method, params = {}) {
        const url = `https://hiviews.net/${method}`;

        const headers = {
            Authorization: this.options.token,
            'content-type': 'application/json',
        };

        const body = {
            ...params,
        };

        try {
            const response = await axios.post(url, body, {
                headers
            });
            const text = response.data;

            this.logger.info(`${method} response: ${JSON.stringify(text)}`);

            return text;
        } catch (error) {
            console.log(error)
        }
    }

    async sendMessage(options) {
        return this.request('sendMessage', options);
    }
}

module.exports = HiViews;