const {
    DataTypes,
    Model
} = require('sequelize');

const db = require('../db/db');

class User extends Model {}

User.init({
    tgId: {
        type: DataTypes.BIGINT,
        primaryKey: true,
    },
    lastSeen: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    subscription: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    firstName: {
        type: DataTypes.STRING,
        defaultValue: "",
    },
    userToken: {
        type: DataTypes.STRING,
        defaultValue: "",
    },
    username: {
        type: DataTypes.STRING,
        defaultValue: ""
    },
    invitedBy: {
        type: DataTypes.STRING,
        defaultValue: ""
    },
    payload: {
        type: DataTypes.STRING,
        defaultValue: ""
    },
    points: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    invitesCounter: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    languageCode: {
        type: DataTypes.STRING,
        defaultValue: "en",
    },
}, {
    sequelize: db,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
});

(async () => {
    try {
        await User.sync({
            alter: true
        });
        console.log('Модель User успешно синхронизирована с базой данных.');
    } catch (error) {
        console.error('Ошибка при синхронизации модели User:', error);
    }
})();

module.exports = User;