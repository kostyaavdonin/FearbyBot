const axios = require('axios');

function isVip(user) {
    return new Date(user.subscription).getTime() > Date.now() ? true : false
}

async function getLocationByIP(ip) {
    const apiKey = '57389d29162abd'; // Укажите ваш API ключ, если он необходим
    const url = `https://ipinfo.io/${ip}/json?token=${apiKey}`;

    const response = await axios.get(url);
    const data = response.data;

    console.log(data)

    return {
        location: `${data.city}, ${data.region}, ${data.country}`,
        coordinates: data.loc
    }
}
module.exports = {
    isVip,
    getLocationByIP
};