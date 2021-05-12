const Markup = require('telegraf/markup');

const orderMenu = Markup.keyboard([
    ['Отправить вакансию'],
    ['Мои вакансии', 'Условия размещения']
]).resize().extra();


module.exports.tfSendStartMenu = (ctx) => {
    return ctx.replyWithMarkdown(`Приветствую, ${ctx.message.from.first_name}!\n\nПрисылайте сюда вакансии,\nкоторые хотите опубликовать в\n[Бирже копирайта](https://t.me/joinchat/AAAAAFejkjmdfPoF2iwk5w)`, {...orderMenu, disable_web_page_preview: true});
}

module.exports.tfSendOrderMenu = (ctx) => {
    return ctx.replyWithMarkdown('Присылайте сюда вакансии,\nкоторые хотите опубликовать в\n[Бирже копирайта](https://t.me/joinchat/AAAAAFejkjmdfPoF2iwk5w)', {...orderMenu, disable_web_page_preview: true});
}

module.exports.tfSendBackToMM = (ctx, text) => {
    return ctx.reply(text, Markup.keyboard([
        ['Вернуться в главное меню']
    ]).resize().extra());
}

