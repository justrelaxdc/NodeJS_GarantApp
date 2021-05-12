const mongoose = require('mongoose');
const { errorLog } = require('../helpers/logger');

const USER = "garantAdmin";
const PASSWORD = "rtyghjcvbn24";
const DB_NAME = 'garant-application';
const SERVER = '127.0.0.1';
const PORT = 27017;

if(global.IS_PROD){
    mongoose.connect(`mongodb://${USER}:${PASSWORD}@${SERVER}:${PORT}/${DB_NAME}?retryWrites=true&authSource=admin`, { useNewUrlParser: true, useUnifiedTopology: true});
}else{
    mongoose.connect(`mongodb://${SERVER}:${PORT}/${DB_NAME}?retryWrites=true&authSource=admin`, { useNewUrlParser: true, useUnifiedTopology: true });
}

mongoose.connection.on('error', (err) => {
    errorLog('Error connecting to DB', err);
    process.exit(0);
});

module.exports = mongoose;

