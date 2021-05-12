const cron = require('cron');
const series = require('async/series');
const {errorLog, log} = require('../helpers/logger');
const {cleanFolder} = require('../helpers/helper');

const textru = require("./stores/copyright/textruStore");
const etext = require("./stores/copyright/etxtruStore");
const advego = require("./stores/copyright/advegocomStore");

// Array of all stores' start functions
const dataStores = [
    textru.start,
    etext.start,
    advego.start
];

let canCronStart = true;

module.exports.cronInit = () => {

    new cron.CronJob('0 */1 * * * *', function (err) {
        if (!canCronStart) return;
        if (err) return errorLog("Cron error: ", err);

        canCronStart = false;

        log('CRON get orders begin');

        // Go through all stores one after one and save data in db
        series(dataStores, (err) => { // callback fires when all functions are done or err
            canCronStart = true;
            if(err) errorLog('CRON sync error: ', err);
            cleanFolder('./parser/assets/images/postBannersTemplates/temp'); // Clear up temp folder with images
            log('Did full synchronization');
        });
    }, null, true, 'America/Los_Angeles', null, true);

};

process.on('uncaughtException', (err) => {
    errorLog(err);
    cleanFolder('./parser/assets/images/postBannersTemplates/temp'); // Clear up temp folder with images
    canCronStart = true;
});


