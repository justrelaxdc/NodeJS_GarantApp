const {telegram, bot} = require('../../config/telegram');
const WizardScene = require('telegraf/scenes/wizard');
const {tfSendOrderMenu, tfSendBackToMM} = require('../menus');
const Stage = require('telegraf/stage');
const Markup = require('telegraf/markup');
const {isInt} = require('../../helpers/helper');
const {PROVIDER_TOKEN} = require('../../config/telegram');

module.exports = () => {
    // Сцена создания заказа
    const createOrderScene = new WizardScene(
        "createOrderScene", // Имя сцены
        async (ctx) => {
            ctx.wizard.state.order = {};

            await tfSendBackToMM(ctx, 'Вы перешли в меню создания вакансии\nСледуйте подсказкам бота');
            ctx.reply('Вы хотите, чтобы Webdiscount выступал в качестве гаранта для Вашего заказа?\nПодробнее в "Условиях размещения"', Markup.inlineKeyboard([
                [Markup.callbackButton("Да", "garantYes"), Markup.callbackButton("Нет", "garantNo")]
            ]).extra());

            return ctx.wizard.next();
        },
        (ctx) => {
            if(ctx.update.callback_query){
                ctx.wizard.state.order.garant = ctx.update.callback_query.data === 'garantYes';
            }else{
                ctx.message.text = ctx.message.text.toLowerCase();

                if(ctx.message.text === 'да'){
                    ctx.wizard.state.order.garant = true;
                }else if(ctx.message.text === 'нет'){
                    ctx.wizard.state.order.garant = false;
                }else{
                    ctx.reply('Пожалуйста, нажмите кнопку или введите Да/Нет');
                    return;
                }
            }

            ctx.reply('Хорошо! Теперь введите название задачи.\nПример: Обзор охранной сигнализации Страж');

            return ctx.wizard.next();
        },
        (ctx) => {
            if(!ctx.message.text){
                ctx.reply('Пожалуйста, введите название задачи');
                return;
            }
            if(ctx.message.text.length <= 6){
                ctx.reply('Пожалуйста, придумайте более содержательное название');
                return;
            }

            ctx.wizard.state.order.title = ctx.message.text;

            let skipBtn = ctx.wizard.state.garant ? Markup.inlineKeyboard([
                [Markup.callbackButton("Пропустить", "skipPrice")]
            ]).extra() : {};

            ctx.reply('Введите цифрами оплату заказа, если по договоренности - нажмите пропустить.', skipBtn);
            return ctx.wizard.next();
        },
        (ctx) => {
            if(ctx.update.callback_query){
                ctx.wizard.state.order.price = 0;
            }else{
                if(!ctx.message.text){
                    ctx.reply('Пожалуйста, введите какое-то значение');
                    return;
                }
                if(!isInt(ctx.message.text)){
                    ctx.reply('Пожалуйста, введите только цифры');
                    return;
                }
                if(ctx.message.text < 20){
                    ctx.reply('Стоимость заказа не может быть меньше 20руб.');
                    return;
                }
                ctx.wizard.state.order.price = ctx.message.text;
            }
            ctx.reply('Введите срок в днях, на исполнение заказа');

            return ctx.wizard.next();
        },
        (ctx) => {
            if(!ctx.message){
                return ctx.reply('Введите срок в днях, на исполнение заказа');
            }
            let deadline = parseInt(ctx.message.text);
            if(!isInt(deadline)){
                return ctx.reply('Пожалуйста, введите только целое число');
            }
            if(deadline < 0){
                return ctx.reply('Cрок не может быть меньше 0!');
            }

            ctx.wizard.state.order.deadline = deadline;

            ctx.reply('Введите ваши контакты, например почту или телеграм');

            return ctx.wizard.next();
        },
        (ctx) => {
            if(!ctx.message.text){
                ctx.reply('Пожалуйста, введите ваши контакты, например почту или телеграм');
                return;
            }

            ctx.wizard.state.order.contacts = ctx.message.text;

            ctx.reply('Введите ссылку на ТЗ.  Если хотите пропустить этот шаг нажмите кнопку "Пропустить".', Markup.inlineKeyboard([
                [Markup.callbackButton("Пропустить", "skipTz")]
            ]).extra());

            return ctx.wizard.next();
        },
        (ctx) => {
            if(ctx.update.callback_query){
                ctx.wizard.state.order.tzLink = false;
            }else {
                if(!ctx.message.text){
                    ctx.reply('Пожалуйста, введите какое-то значение или нажмите кнопку пропустить');
                    return;
                }

                ctx.wizard.state.order.tzLink = ctx.message.text;
            }

            if(ctx.wizard.state.garant){
                ctx.reply(`Отлично! Осталось оплатить размещение заказа 20р и стоимость работ исполнителя ${ctx.wizard.state.order.price}р. Для этого нажмите кнопку "Заплатить".\nПосле оплаты в чат придет уведомление об успешной обработке вакансии и ее рассмотрении модератором.`);
            }else{
                ctx.reply('Отлично! Последний этап оплата размещения заказа. Для этого нажмите кнопку "Заплатить".\nПосле оплаты в чат придет уведомление об успешной обработке вакансии и ее рассмотрении модератором.');
            }

            let title = ctx.wizard.state.garant ? 'Оплата исполнителю + комиссия за услуги' : 'Оплата за размещение заказа';

            telegram.sendInvoice(ctx.chat.id, {
                chat_id: ctx.chat.id,
                title: title,
                description: 'Описание',
                payload: JSON.stringify(ctx.wizard.state.order),
                provider_token: PROVIDER_TOKEN,
                start_parameter: 'pay',
                currency: 'RUB',
                prices: [{
                    label: title,
                    amount: 20 + ctx.wizard.state.order.price
                }]
            });
            tfSendOrderMenu(ctx);
            return ctx.scene.leave();
        }
    );

    // Создаем менеджера сцен
    const stage = new Stage();

    stage.hears([/меню/ig, /вернуться/ig, /выйти/ig], (ctx) => {
        ctx.scene.leave();
        tfSendOrderMenu(ctx);
    });

    // Регистрируем сцены
    stage.register(createOrderScene);
    bot.use(stage.middleware());
}