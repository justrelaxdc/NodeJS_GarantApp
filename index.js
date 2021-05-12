global.IS_PROD = false;

const fastify = require('fastify')();
const db = require('./config/db');
const tfBot = require('./telegramBot/bot');
const cron = require('./parser/cron');
const { log, errorLog } = require('./helpers/logger');

db.connection.once('open', function () {

    log("DB connected!");

    //cron.cronInit();
    tfBot.launch();

    fastify.register(require('point-of-view'), {
        engine: {
            ejs: require('ejs') // подключаем шаблонизатор ejs
        }
    })

    fastify.decorate('mongoose', db);
    fastify.register(require("./controllers/index/controller"), { prefix: '' });
    fastify.register(require("./controllers/botApi/controller"), { prefix: 'api' });
    fastify.register(require("./controllers/ordersAdmin/controller"), { prefix: 'ordersAdmin' });

    fastify.listen(80, '0.0.0.0', function (err, address) {
        if (err) {
            errorLog(err);
            process.exit(1);
        }

        log(`server listening on ${address}`);
    })

});