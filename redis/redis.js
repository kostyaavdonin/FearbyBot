const Redis = require('ioredis');
require('dotenv').config();

const redis = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
});

redis.on('connect', () => {
    console.log('Успешное подключение к Redis');
});

redis.on('error', (err) => {
    console.error('Ошибка Redis:', err);
});

module.exports = redis;