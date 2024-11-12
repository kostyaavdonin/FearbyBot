const {
    MessageContext,
    InlineKeyboardBuilder
} = require("puregram");

const {
    Sequelize
} = require("sequelize");

const {
    User
} = require("../../database/models");

const moment = require('moment-timezone');

const statisticsMenu = async (context, params) => {
    let start = Date.now();

    const moscowTime = moment().tz('Europe/Moscow');

    const dateNowUTC = moscowTime.clone().utc().format('YYYY-MM-DD HH:mm:ss');

    const todayStartUTC = moscowTime.clone().startOf('day').utc().format('YYYY-MM-DD HH:mm:ss');
    const todayEndUTC = moscowTime.clone().endOf('day').utc().format('YYYY-MM-DD HH:mm:ss');

    const yesterdayStartUTC = moscowTime.clone().subtract(1, 'day').startOf('day').utc().format('YYYY-MM-DD HH:mm:ss');
    const yesterdayEndUTC = moscowTime.clone().subtract(1, 'day').endOf('day').utc().format('YYYY-MM-DD HH:mm:ss');

    const weekStartUTC = moscowTime.clone().startOf('isoWeek').utc().format('YYYY-MM-DD HH:mm:ss');
    const monthStartUTC = moscowTime.clone().startOf('month').utc().format('YYYY-MM-DD HH:mm:ss');

    const sequelize = User.sequelize;

    const [userStats] = await Promise.all([
        sequelize.query(`
                SELECT
                    COUNT(*) AS "totalUsers",
                    SUM(CASE WHEN "createdAt" >= :todayStartUTC AND "createdAt" < :todayEndUTC THEN 1 ELSE 0 END) AS "registeredToday",
                    SUM(CASE WHEN "createdAt" >= :yesterdayStartUTC AND "createdAt" < :yesterdayEndUTC THEN 1 ELSE 0 END) AS "registeredYesterday",
                    SUM(CASE WHEN "createdAt" >= :weekStartUTC AND "createdAt" <= :dateNowUTC THEN 1 ELSE 0 END) AS "registeredPerWeek",
                    SUM(CASE WHEN "createdAt" >= :monthStartUTC AND "createdAt" <= :dateNowUTC THEN 1 ELSE 0 END) AS "registeredPerMonth"
                FROM "users";
            `, {
            replacements: {
                dateNowUTC,
                todayStartUTC,
                todayEndUTC,
                yesterdayStartUTC,
                yesterdayEndUTC,
                weekStartUTC,
                monthStartUTC
            },
            type: sequelize.QueryTypes.SELECT
        })
    ]);

    const stats = {
        ...userStats[0]
    };

    let text = `
*Статистика по пользователям*

*Общее*
• Пользователей: \`${stats.totalUsers}\` чел.

*Регистрации*
• Сегодня: \`${stats.registeredToday}\` чел.
• Вчера: \`${stats.registeredYesterday}\` чел.
• С начала недели: \`${stats.registeredPerWeek}\` чел.
• С начала месяца: \`${stats.registeredPerMonth}\` чел.

⏱ Время выполнения: \`${Date.now() - start}ms\`
`;

    let messageParams = {
        parse_mode: "Markdown",
        reply_markup: new InlineKeyboardBuilder()
            .textButton({
                text: '🔁',
                payload: {
                    command: 'statistics'
                }
            }).row()
            .textButton({
                text: '↩️ Назад',
                payload: {
                    command: 'admin'
                }
            }).row()
    };

    if (context instanceof MessageContext) {
        await context.send(text, messageParams);
    } else {
        await context.message.editMessageText(text, messageParams);
    }
}

module.exports = {
    execute: statisticsMenu,
    access: 'admin'
};