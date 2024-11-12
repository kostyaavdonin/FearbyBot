const {
    Sequelize
} = require('sequelize');

require('dotenv').config();

const requiredEnv = ['DATABASE', 'LOGIN', 'PASSWORD'];
    requiredEnv.forEach((env) => {
        if (!process.env[env]) {
            throw new Error(`Не установлена переменная окружения ${env}`);
        }
    });

const sequelize = new Sequelize(
    process.env.DATABASE,
    process.env.LOGIN,
    process.env.PASSWORD, {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'postgres',
        logging: process.env.DB_LOGGING === 'true' ? console.log : false,
        pool: {
            max: parseInt(process.env.DB_POOL_MAX, 10) || 10,
            min: parseInt(process.env.DB_POOL_MIN, 10) || 0,
            acquire: parseInt(process.env.DB_POOL_ACQUIRE, 10) || 60000,
            idle: parseInt(process.env.DB_POOL_IDLE, 10) || 5000,
        },
        define: {
            timestamps: true,
        },
        query: {
            raw: true
        }
    }
);

sequelize.authenticate()
    .then(() => {
        console.log('Подключение к базе данных успешно установлено.');
    })
    .catch((err) => {
        console.error('Невозможно подключиться к базе данных:', err);
    });

module.exports = sequelize;