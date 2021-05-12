const fs = require('fs');
const util = require('util');

const LOG = true;
const ERROR_LOG = true;
const CONSOLE_LOG = true;
const FILE_LOG = true;

const logFile = fs.createWriteStream(__dirname + '/debug.log', {flags : 'a'});
const errorLogFile = fs.createWriteStream(__dirname + '/error.log', {flags : 'a'});

module.exports.log = (...val) => {
    if(!LOG) return;

    let time = new Date().toISOString();
    time = time.substring(0, time.length - 5);

    if(CONSOLE_LOG){
        console.log(new Date(), ...val);
    }

    if(FILE_LOG){
        logFile.write( util.format(time + ':', ...val) + '\n');
    }
}

module.exports.errorLog = (...val) => {
    if(!ERROR_LOG) return;

    let time = new Date().toISOString();
    time = time.substring(0, time.length - 5);

    if(CONSOLE_LOG){
        console.error(new Date(), ...val);
    }

    if(FILE_LOG){
        errorLogFile.write(util.format(time + ':', ...val) + '\n');
    }
}