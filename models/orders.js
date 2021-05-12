const mdb = require('../config/db');

const ordersSchema = new mdb.Schema({
    serviceId: Number,
    freelanceCategory: String,
    serviceName: String,
    title: String,
    description: String,
    tgDescription: String,
    parsedDescription: String,
    price: Number,
    createdAtStr: String,
    createdAtStamp: Number,
    deadlineStr: String,
    deadlineStamp: Number,
    minSize: Number,
    maxSize: Number,
    link: String
});

module.exports = mdb.model('orders', ordersSchema);