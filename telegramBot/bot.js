const {bot} = require('../config/telegram');
const {tfSendStartMenu, tfSendOrderMenu, tfSendBackMenu} = require('./menus');
const createOrderScene = require('./scenes/createOrder');
const {getCurrentTimeUTC, addSecondToTimeUTC, getDateFromTime} = require('../helpers/helper');
const vacanciesModel = require('../models/vacancies');
const {errorLog} = require('../helpers/logger');
const session = require('telegraf/session');
const Markup = require('telegraf/markup');

// Инициализация сцен
bot.use(session());
createOrderScene();

// Мои вакансии
bot.hears(/мои вакансии/ig, async (ctx) => {
    let vacancies = await vacanciesModel.find({
        clientId: ctx.update.message.from.id,
        status: {$in: ['Новый', 'Опубликован', 'В работе', 'Заказчик принял работу']}
    }).sort({createdAtStamp: 1});

    if(vacancies.length === 0) return ctx.reply('Вы еще не выставили ни одной вакансии.');

    for(let i = 0; i < vacancies.length; i++){
        let val = vacancies[i];

        let markup = {};
        if (val.garant && val.status === 'В работе') {
            markup = Markup.inlineKeyboard([
                [Markup.callbackButton("Принять работу", `acceptOrder_${val.orderId}`)]
            ]).extra()
        }

        await ctx.reply(`<b>Вакансия №${val.orderId}</b>\nЗаголовок: ${val.title}\nСтатус: ${val.status}\nОплата: ${val.price === 0 ? 'Договорная' : val.price + 'р.'}\nГарант: ${val.garant ? 'Да' : 'Нет'}\nСоздан: ${getDateFromTime(val.createdAtStr)}\nДедлайн: ${getDateFromTime(val.deadlineDateStr)}`, {...markup, parse_mode: 'HTML'});
    }

    await ctx.reply('Выше представлен список ваших активных вакансий ⬆');
});

// Вызов меню
bot.start(tfSendStartMenu);
bot.hears([/меню/ig, /menu/ig], tfSendOrderMenu);

// Создание заказа
bot.hears('Отправить вакансию', (ctx) => {
    ctx.scene.enter("createOrderScene")
});
// Условия размещения
bot.hears('Условия размещения', (ctx) => {
    return ctx.reply('Вакансия остаётся в ленте навсегда. \nУдаление возможно по вашему запросу либо при поступлении жалоб с доказательством о мошенничестве.\nСтоимость размещения ?р.');
});

// Order checkout handlers
bot.on('pre_checkout_query', ({answerPreCheckoutQuery}) => answerPreCheckoutQuery(true));
bot.on('successful_payment', (res) => {
    let data = JSON.parse(res.update.message.successful_payment.invoice_payload);
    let order = {};
    let orderId = res.update.message.successful_payment.provider_payment_charge_id;
    order.orderId = orderId.slice(orderId.lastIndexOf('_') + 1, -1);
    order.clientId = res.update.message.from.id;
    order.status = "Новый";
    order.title = data.title;
    order.description = data.description;
    order.tz = data.tzLink;
    order.price = data.price;
    order.createdAtStamp = Date.now();
    order.createdAtStr = getCurrentTimeUTC();
    order.garant = data.garant;
    order.deadlineHours = data.deadline;
    order.deadlineDateStr = addSecondToTimeUTC(getCurrentTimeUTC(), data.deadline * 60 * 60);
    order.deadlineDateStamp = Date.now() + (data.deadline * 60 * 60 * 1000);
    order.contacts = data.contacts;

    vacanciesModel(order).save(async (err) => {
        if (err) return errorLog(["Error saving new vacancy", err]);
    });
});

module.exports = bot;
