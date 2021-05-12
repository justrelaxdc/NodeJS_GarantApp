const ordersModel = require('../../../models/orders');
const {log} = require('../../../helpers/logger');
const telegram = require('../../telegramSender');
const needle = require('needle');
const each = require('async/each');
const cheerio = require('cheerio');
const BaseStore = require('./baseStore');
const wp = require("../../wordpress");

module.exports = class advegoCom extends BaseStore{
    static start(storeFinish) {
        log('advego.com started synchronization');
        const options = {
            headers: {
                "Cookie": "sid=YXbwteRymHGA9OoqeYYsF3G8RBeXiP8hHekb8XuxqLZtTwpRvxnATXC4XFghgr07vdkcPJjC3ijEJV8TeXhW79CDbS0;",
            },
        }


        needle.get('https://advego.com/job/find/?jt=3&jt=5&jt=2&jt=1&wl=-1&of=1&tender=on&white=on&open=on&like_filter=0&all_levels=1&ic=643&s=6&', options, function (err, res) {
            if (err) return storeFinish(["Error getting orders code advego.com: ", "\n\n Error: ", err]);
            if (!res || res.statusCode !== 200) return storeFinish(["Error getting orders code advego.com: ", res]);

            let ordersList = [];

            const $ = cheerio.load(res.body);
            $('.list_item').each(function(i, elem) {
                let order = {};
                order.title = $(this).find('.order-title a').text().trim();
                order.link = 'https://advego.com' + $($(this).find('.order-title a')).attr('href') + '?ref=4YHVf4q7MC';
                if(!order.title) return;
                order.price = $(this).find('.price').text().trim();
                if(order.price.includes('-')){
                    order.price = order.price.split('-')[1].trim();
                }
                order.price = Number(order.price.split(' руб.').join(''));
                order.minSize = $(this).find('.order_len_min').text().trim();
                order.maxSize = $(this).find('.order_len_max').text().trim();
                if(!order.maxSize){
                    order.maxSize = order.minSize;
                    order.sizeText = `от ${order.minSize}`
                }else{
                    order.sizeText = `от ${order.minSize} до ${order.maxSize}`
                }
                order.deadlineStamp = $(this).find('.post_len').text().split('/')[1].split(' ч')[0].trim();
                order.deadlineStamp = Number(order.deadlineStamp) * 60 * 60; // To seconds
                order.deadlineStr = BaseStore.addSecondToTimeUTC(BaseStore.getCurrentTimeUTC(), order.deadlineStamp);
                order.deadlineStamp = Date.now() + (order.deadlineStamp * 1000);
                order.createdAtStr = new Date($(this).find('.last-modify-date').attr('data-last-modify-date'));
                order.createdAtStamp = order.createdAtStr.getTime();
                order.serviceId = $(this).find('.change_order_desc').data('id-order');
                ordersList.push(order);
            });

            ordersList = ordersList.filter(function (el) {
                return el.price >= 500;
            });
            // Go through all objects in array at the time
            each(ordersList, advegoCom.process, (err) => { // Fires after all requests finished or error
                log("advego.com synchronization finished!");
                storeFinish(err); // Fire err if it's not empty
            });
        });

        // (async () => {
        //     let options = {
        //         headers: {
        //             "Content-Type": "application/x-www-form-urlencoded",
        //             "x-requested-with": "XMLHttpRequest",
        //             "referer": "https://advego.com/",
        //         }
        //     }
        //
        //     let data = "method=login&login=rossomakha20000%40gmail.com&pwd=998877qwaszxQW&remember=on"
        //
        //     let res = await needle('post', `https://advego.com/jsnc/auth`, data, options)
        //         .then((res) => {
        //             res.body = JSON.parse(res.body);
        //             console.log(res.body);
        //             if (res.body.success !== 'Вы успешно авторизованы в системе') {
        //                 return {ok: false, err: res.body};
        //             }
        //
        //
        //
        //             return {ok: true, body: res.body}
        //         }).catch((err) => {
        //             console.log(err);
        //             return {ok: false, err: err}
        //         })
        //
        //
        //     storeFinish();
        // })();
    }

    static process(order, callback) {
        console.log(order.createdAtStamp - 86400000)
        ordersModel.findOne({
            freelanceCategory: "copyright",
            title: order.title,
            price: order.price,
            createdAtStamp: {$gte: order.createdAtStamp - 86400000} // Find till 24 hours from order creation
        }, (err, isOrderExists) => {
            if (err) return callback(["Error trying to get order in DB advego.com: ", err]);

            if (isOrderExists) {
                return callback();
            }

            ordersModel({
                serviceId: order.serviceId,
                freelanceCategory: "copyright",
                serviceName: "advego.com",
                title: order.title,
                price: order.price,
                createdAtStr: order.createdAtStr,
                createdAtStamp: order.createdAtStamp,
                deadlineStr: order.deadlineStr,
                deadlineStamp: order.deadlineStamp,
                minSize: order.minSize,
                maxSize: order.maxSize,
                link: order.link
            }).save(async (err) => {
                if (err) return callback(["Error saving new order in DB text.ru", err]);

                let result;
                result = await telegram.sendMessage(order.title, order.price, order.deadlineStamp, order.link, order.sizeText, 'advego.com', "https://advego.com/4YHVf4q7MC");
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