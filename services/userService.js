const {
    User
} = require('../database/models');

const redis = require('../redis/redis');

require("dotenv").config();

async function cacheUser(user) {
    const key = `${process.env.BOTNAME}:user:${user.tgId}`;
    const value = JSON.stringify(user);
    await redis.set(key, value, 'EX', 600);
}

async function getUser(userId) {
    const key = `${process.env.BOTNAME}:user:${userId}`;

    const cachedUser = await redis.get(key);
    if (cachedUser || cachedUser === undefined) {
        return JSON.parse(cachedUser);
    } else {
        const user = await User.findByPk(userId);
        if (user) {
            await cacheUser(user).catch(error => console.log(error));
            return user;
        } else {
            return null;
        }
    }
}

async function updateUser(userId, newUserData) {
    try {
        const [updatedRowsCount, updatedRows] = await User.update(newUserData, {
            where: {
                tgId: userId
            },
            returning: true
        });

        if (updatedRowsCount === 0 || !updatedRows || updatedRows.length === 0) {
            return null;
        }

        const updatedUser = updatedRows[0];

        await cacheUser(updatedUser);

        return updatedUser;
    } catch (error) {
        console.error('Ошибка при обновлении пользователя:', error);
        throw error;
    }
}

async function registerUser(context) {
    let payload = context.startPayload == undefined ? '' : context.startPayload;

    try {
        const existingUser = await User.findByPk(context.from.id);

        if (!existingUser) {
            await User.create({
                tgId: context.from.id,
                languageCode: context.from.languageCode,
                payload: context.startPayload ?? '',
                username: context.from.username ?? '',
                firstName: context.from.firstName,
                lastSeen: new Date(),
                userToken: generateToken(16),
                invitedBy: payload
            });

            console.log(`User with ID ${context.from.id} registered successfully.`);
        } else {
            console.log(`User with ID ${context.from.id} already exists.`);
        }
    } catch (error) {
        console.error('Error registering user:', error);
    }

    if (payload && typeof payload === "number") {
       let user = await getUser(payload).catch(error => console.log(error));

        if(user) {
            await Promise.all([
                updateUser(user.tgId, { points: user.points + 1, invitesCounter: user.invitesCounter + 1 }).catch(error => console.log(error))
            ]);
        }
    }
}

function generateToken(length = 10) {
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    
    for (let i = 0; i < length; i++) {
        const randomChar = characters[Math.floor(Math.random() * characters.length)];
        result += randomChar;
    }
    
    return result;
}

module.exports = {
    cacheUser,
    getUser,
    updateUser,
    registerUser,
    generateToken
};