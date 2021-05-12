const Telegraf = require('telegraf');
const Telegram = require('telegraf/telegram')

const TOKEN = '1109151910:AAGJvWXfEucPVHJXSMW-p1BElXXqtagjdAI';
const TEST_TOKEN = '1178364015:AAGceQArYa5fhFasW8gvVIRCasXXzQpKwtc';
const CHANNEL_ID = "-1001470337593";
const TEST_CHANNEL_ID = "@superduperchanneltest";
const PROVIDER_TOKEN = '410694247:TEST:d9611267-e467-4563-a686-aa68a9e2a3f7';
const TEST_PROVIDER_TOKEN = '410694247:TEST:47b81f10-41c8-4b3b-bdc6-53fa40505572';

module.exports.CHANNEL_ID = global.IS_PROD ? CHANNEL_ID : TEST_CHANNEL_ID;
module.exports.TOKEN = global.IS_PROD ? TOKEN : TEST_TOKEN;
module.exports.PROVIDER_TOKEN = global.IS_PROD ? PROVIDER_TOKEN : TEST_PROVIDER_TOKEN;

// Создаем экземпляр телеграм бота
module.exports.telegram = new Telegram(global.IS_PROD ? TOKEN : TEST_TOKEN)
module.exports.bot = new Telegraf(global.IS_PROD ? TOKEN : TEST_TOKEN);