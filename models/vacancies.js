const mdb = require('../config/db');

const vacanciesSchema = new mdb.Schema({
    clientId: Number,
    orderId: String,
    status: String,
    statusCode: Number,
    title: String,
    description: String,
    tz: String,
    price: Number,
    createdAtStr: String,
    createdAtStamp: Number,
    garant: Boolean,
    deadlineHours: Number,
    deadlineDateStr: String,
    deadlineDateStamp: Number,
    contacts: String
});

module.exports = mdb.model('vacancies', vacanciesSchema);