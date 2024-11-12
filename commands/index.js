const startCommand = require('./user/start');
const privacyCommand = require('./user/privacy');
const premiumCommand = require('./user/premium');
const referralCommand = require('./user/referral');
const adminMenu = require('./admin/admin');
const statisticsMenu = require('./admin/statistics');

module.exports = {
    start: startCommand,
    privacy: privacyCommand,
    premium: premiumCommand,
    referral: referralCommand,
    admin: adminMenu,
    statistics: statisticsMenu
};
