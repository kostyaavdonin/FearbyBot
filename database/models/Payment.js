const {
    DataTypes,
    Model
} = require('sequelize');

const db = require('../db/db');

class Payment extends Model {}

Payment.init({
    tgId: {
        type: DataTypes.BIGINT,
    },
    amount: {
        type: DataTypes.BIGINT,
    },
    type: {
        type: DataTypes.STRING,
        defaultValue: "stars"
    },
    paymentSent: {
        type: DataTypes.DATE,
        defaultValue: new Date(0),
    },
}, {
    sequelize: db,
    modelName: 'Payment',
    tableName: 'payments',
    timestamps: true,
});

(async () => {
    try {
        await Payment.sync({
            alter: true
        });
        console.log('Модель Payment успешно синхронизирована с базой данных.');
    } catch (error) {
        console.error('Ошибка при синхронизации модели Payment:', error);
    }
})();

module.exports = Payment;