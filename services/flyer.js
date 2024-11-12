const axios = require('axios');

const {
    Logger
} = require('@starkow/logger');

class Flyer {
    constructor(options) {
        this.options = options;
        this.logger = Logger.create('flyer');
    }

    async request(method, params = {}) {
        const url = `https://api.flyerservice.io/${method}`;

        const headers = {
            'Content-Type': 'application/json',
        };

        const body = {
            key: this.options.token,
            ...params,
        };

        try {
            const response = await axios.post(url, body, {
                headers
            });
            return response.data;
        } catch (error) {
            this.logger.error('Request failed', error);
            throw error;
        }
    }

    async getMe() {
        return this.request('get_me');
    }

    async check(userId, languageCode) {
        if (userId < 0) {
            return true;
        }

        const data = {
            user_id: userId,
            language_code: languageCode,
        };

        try {
            const response = await this.request('check', data);

            if (response.warning || response.error || response.info) {
                //this.logger.warn(response);
            }

            if (response.skip && !response.error) {
                // todo: set in cache
            }

            return response.skip;
        } catch (error) {
            this.logger.error('Check request failed', error);
            throw error;
        }
    }
}

module.exports = Flyer;