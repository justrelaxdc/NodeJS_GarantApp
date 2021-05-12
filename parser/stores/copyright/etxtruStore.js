const ordersModel = require('../../../models/orders');
const {log} = require('../../../helpers/logger');
const telegram = require('../../telegramSender');
const wp = require("../../wordpress");
const needle = require('needle');
const each = require('async/each');
const table = require('html-table-to-json');
const BaseStore = require('./baseStore');

module.exports = class Etxtru extends BaseStore {
    static start(storeFinish) {
        needle.get('https://www.etxt.ru/rss/tasks/', function (err, res) {
            if (err) return storeFinish(["Error getting orders code text.ru: ", "\n\n Error: ", err]);
            if (!res || res.statusCode !== 200) return storeFinish(["Error getting orders code text.ru: ", res]);
            log('Etxt.ru started synchronization');

            let orders = [], temp, orderType;
            for (let i = 5; i < res.body.children[0].children.length - 5; i++) {
                orders.push(res.body.children[0].children[i]);

                temp = {};
                temp.title = orders[i - 5].children[0].value;
                temp.link = orders[i - 5].children[1].value + "&r=webdiscount";
                temp.createdAtStr = new Date(orders[i - 5].children[4].value).toISOString();
                temp.createdAtStamp = Date.parse(orders[i - 5].children[4].value);
                temp.description = orders[i - 5].children[2].value;
                orders[i - 5] = temp;

                temp = table.parse(orders[i - 5].description).results;

                if (
                    temp[0][0]['Копирайтинг'] === undefined
                    && temp[0][0]['Копирайтинг с размещением в сети'] === undefined
                    && temp[0][0]['SEO-копирайтинг'] === undefined
                ) {
                    orders[i - 5] = null;
                    continue;
                }

                if (temp[0][0]['Копирайтинг'] !== undefined) {
                    orderType = 'Копирайтинг';
                } else if (temp[0][0]['Копирайтинг с размещением в сети'] !== undefined) {
                    orderType = 'Копирайтинг с размещением в сети';
                } else if (temp[0][0]['SEO-копирайтинг'] !== undefined) {
                    orderType = 'SEO-копирайтинг';
                }

                orders[i - 5].sizeText = temp[0][3][orderType];
                orders[i - 5].price = temp[0][4][orderType];
                orders[i - 5].description = temp[0][1][orderType];
                orders[i - 5].deadlineStr = new Date(Etxtru.reverseDate(temp[0][5][orderType]) + 'T00:00:00+0000').toISOString();
                orders[i - 5].deadlineStamp = Date.parse(orders[i - 5].deadlineStr);
            }

            orders = orders.filter(function (el) {
                return el != null;
            });

            orders.forEach((el, i) => {
                orders[i].price = Number(orders[i].price.slice(0, orders[i].price.indexOf('рублей') - 1));
                orders[i].minSize = orders[i].sizeText.slice(0, orders[i].sizeText.indexOf('символов') - 1);
                orders[i].maxSize = orders[i].minSize;
                orders[i].sizeText = 'от ' + orders[i].minSize;
                orders[i].tgDescription = Etxtru.prepareTextToTg(orders[i].description, 350);
            });

            orders = Etxtru.removeDublicatesFormOrdersList(orders);

            orders = orders.filter(function (el) {
                return el.price >= 900;
            });

            // Go through all objects in array at the time
            each(orders, Etxtru.process, (err) => { // Fires after all requests finished or error
                log("etxt.ru synchronization finished!");
                storeFinish(err); // Fire err if it's not empty
            });
        });
    }

    static process(order, callback) {
        ordersModel.findOne({
            freelanceCategory: "copyright",
            title: order.title,
            price: order.price,
            createdAtStamp: {$gte: order.createdAtStamp - 86400000} // Find till 24 hours from order creation
        }, (err, isOrderExists) => {
            if (err) return callback(["Error trying to get order in DB etxt.ru: ", err]);

            if (isOrderExists) {
                return callback();
            }

            ordersModel({
                serviceId: 0,
                freelanceCategory: "copyright",
                serviceName: "etxt.ru",
                title: order.title,
                description: order.description,
                tgDescription: order.tgDescription,
                price: order.price,
                createdAtStr: order.createdAtStr,
                createdAtStamp: order.createdAtStamp,
                deadlineStr: order.deadlineStr,
                deadlineStamp: order.deadlineStamp,
                minSize: order.minSize,
                maxSize: order.maxSize,
                link: order.link
            }).save(async (err) => {
                if (err) return callback(["Error saving new order in DB etxt.ru", err]);

                let result;

                result = await telegram.sendMessage(order.title, order.price, order.deadlineStr, order.link, order.sizeText, order.tgDescription, 'etxt.ru', "https://www.etxt.ru/?r=webdiscount");
                if (!result.ok) {
                    return callback("Telegram sending message error");
                }

                result = await wp.addPost(order.title, order.description, order.price, result.imageUrl, order.link);
                if (!result.ok) {
                    return callback("Wordpress sending message error");
                }

                callback();
                log("Post added!");
            });
        });
    }
}