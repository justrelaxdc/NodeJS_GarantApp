const ordersModel = require('../../../models/orders');
const {log} = require('../../../helpers/logger');
const telegram = require('../../telegramSender');
const wp = require("../../wordpress");
const needle = require('needle');
const crypto = require('crypto');
const each = require('async/each');
const BaseStore = require('./baseStore');

module.exports = class Textru extends BaseStore{
    static start(storeFinish) {
        const apiKey = "169e0411267c955474f0474e881589ba";
        let fromTime, limit;

        ordersModel.findOne({serviceName: "text.ru", freelanceCategory: "copyright"}, null, {sort: {createdAtStamp: -1}}, (err, order) => {
            if (err) return storeFinish(["Error getting last added order in DB text.ru: ", err]);

            if (order) {
                fromTime = Textru.addSecondToTimeUTC(order.createdAtStr, 1);
                limit = 5;
            } else {
                fromTime = "2010-05-10T16:27:26+00:00";
                limit = 5;
            }

            const body = [{
                "jsonrpc": "2.0",
                "method": "order.getList",
                "id": 0,
                "params": {
                    "limit": limit,
                    "offset": 0,
                    "sort": {"name": "Order.createdAt", "dir": "DESC"},
                    "participant": false,
                    "performerId": 3617002,
                    "exchangeType": 1,
                    "fromWhitelist": false,
                    "enableBlacklist": false,
                    "createdAt": {
                        "from": fromTime,
                        "till": Textru.getCurrentTimeUTC()
                    },
                    "deadline": {"from": null, "till": null},
                    "performerRank": 0,
                    "price": {"from": 0},
                    "languageId": [
                        11, 15, 19, 8, 10, 14, 9, 18, 3, 2, 17, 4, 1
                    ]
                }
            }]
            const xsing = crypto.createHash("sha256").update(JSON.stringify(body) + apiKey).digest("hex");
            const options = {
                headers: {
                    "X-Key": apiKey,
                    "X-Sign": xsing
                },
                json: true
            }

            needle.post('https://exchange.text.ru/api/performer', body, options, function (err, res) {
                if (err) return storeFinish(["Error getting orders code text.ru: ", "\n\n Error: ", err]);
                if (!res || res.statusCode !== 200) return storeFinish(["Error getting orders code text.ru: ", res]);
                log('Text.ru started synchronization');

                let ordersList;

                try {
                    ordersList = res.body[0].result.list;
                } catch (e) {
                    if (e instanceof TypeError) {
                        return storeFinish('Cannot get list of orders text.ru')
                    } else {
                        throw e;
                    }
                }

                ordersList = ordersList.reverse();

                // Normalize orders
                for (let i in ordersList) {
                    ordersList[i].title = Textru.firstLetterCapital(ordersList[i].title);
                    ordersList[i].title = ordersList[i].title.replace(/ *\[[^)]*\] */g, ""); // Remove numbers inside []
                    ordersList[i].title = ordersList[i].title.trim(); // Remove spaces at the beginning and ending of the title
                    ordersList[i].description = Textru.bbcodeParse(ordersList[i].description.trim());
                    ordersList[i].link = "https://text.ru/webdiscount/exchange/orders/view/" + ordersList[i].id;
                    ordersList[i].price = Number(ordersList[i].price);
                    ordersList[i].minSize = ordersList[i].workRequirements.minimalSize;
                    ordersList[i].maxSize = ordersList[i].workRequirements.maximalSize;
                    if (ordersList[i].minSize && ordersList[i].maxSize && ordersList[i].minSize === ordersList[i].maxSize) {
                        ordersList[i].sizeText = `от ${ordersList[i].minSize}`;
                    } else if (ordersList[i].minSize && ordersList[i].maxSize) {
                        ordersList[i].sizeText = `от ${ordersList[i].minSize} до ${ordersList[i].maxSize}`;
                    } else if (ordersList[i].minSize && !ordersList[i].maxSize) {
                        ordersList[i].sizeText = `от ${ordersList[i].minSize}`;
                    } else if (!ordersList[i].minSize && ordersList[i].maxSize) {
                        ordersList[i].sizeText = `до ${ordersList[i].maxSize}`;
                    } else if (!ordersList[i].minSize && !ordersList[i].maxSize) {
                        ordersList[i].sizeText = `не указано`;
                    }
                    ordersList[i].tgDescription = Textru.prepareTextToTg(ordersList[i].description, 350);
                }

                ordersList = Textru.removeDublicatesFormOrdersList(ordersList);

                ordersList = ordersList.filter(function (el) {
                    return el.price >= 900;
                });

                // Go through all objects in array at the time
                each(ordersList, Textru.process, (err) => { // Fires after all requests finished or error
                    log("text.ru synchronization finished!");
                    storeFinish(err); // Fire err if it's not empty
                });
            })

        });
    }

    static process(order, callback) {
        ordersModel.findOne({
            freelanceCategory: "copyright",
            title: order.title,
            price: order.price,
            createdAtStamp: {$gte: Date.parse(order.createdAt) - 86400000} // Find till 24 hours from order creation
        }, (err, isOrderExists) => {
            if (err) return callback(["Error trying to get order in DB text.ru: ", err]);

            if (isOrderExists) {
                return callback();
            }

            ordersModel({
                serviceId: order.id,
                freelanceCategory: "copyright",
                serviceName: "text.ru",
                title: order.title,
                description: order.description,
                tgDescription: order.tgDescription,
                price: order.price,
                createdAtStr: order.createdAt,
                createdAtStamp: Date.parse(order.createdAt),
                deadlineStr: order.deadline,
                deadlineStamp: Date.parse(order.deadline),
                minSize: order.minSize,
                maxSize: order.maxSize,
                link: order.link
            }).save(async (err) => {
                if (err) return callback(["Error saving new order in DB text.ru", err]);

                let result;
                result = await telegram.sendMessage(order.title, order.price, order.deadline, order.link, order.sizeText, order.tgDescription, 'text.ru', "https://text.ru/webdiscount");
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