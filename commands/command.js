require('dotenv').config();

const adminIds = new Set(
    process.env.ADMINS ?
    process.env.ADMINS.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) :
    []
);

async function execute(context, slug, params = "no parameters") {
    const commands = require('./');

    const commandInfo = commands[slug];

    if (!commandInfo) {
        console.error(`Команда "${slug}" не найдена.`);
        return;
    }

    const userId = context.from.id;

    const isAdmin = adminIds.has(userId);

    if (commandInfo.access === 'admin' && !isAdmin) {
        console.log(`Пользователь с ID ${userId} попытался выполнить команду "${slug}", но не имеет прав администратора.`);
        return;
    }

    if (typeof commandInfo.execute !== 'function') {
        console.error(`Команда "${slug}" не содержит функцию execute.`);
        return;
    }

    try {
        return await commandInfo.execute(context, params);
    } catch (error) {
        console.error(`Ошибка при выполнении команды "${slug}":`, error);
    }
}

module.exports = {
    execute
};