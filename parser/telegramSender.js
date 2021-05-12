const needle = require('needle');
const {errorLog} = require('../helpers/logger');
const {sleep} = require('../helpers/helper');
const createImageWithText = require('./imageWriter').createTGImageWithText;
const {TOKEN, CHANNEL_ID} = require('../config/telegram');

module.exports.sendMessage = async function (title, price, deadline, link, sizeText, tgDescription, serviceName, serviceRef) {
    if (price === 0) {
        price = "договорная";
    }else{
        price += 'руб'
    }

    deadline = new Date(deadline);
    deadline = Math.ceil((deadline.getTime() - Date.now()) / 1000 / 60 / 60 / 24);
    if(deadline === 0){
        deadline = 'сегодня';
    }else if(deadline === 1){
        deadline += ' день';
    }else if(deadline >= 2 && deadline <= 4){
        deadline += ' дня';
    }else if(deadline >= 5){
        deadline += ' дней';
    }

    const text = makeOrderMessage(title, deadline, price, sizeText, serviceName, serviceRef, tgDescription);

    let result;
    let attempts = 0;

    result = await createImageWithText(title, price, deadline, sizeText, serviceName);
    if (!result.ok) {
        errorLog("Telegram Create Image Banner API error: ", result.err);
        return {ok: false};
    }

    const image_path = result.TEMP_PATH;

    while (true) {
        attempts++;

        if (attempts > 75) {
            errorLog("Telegram API error: cannot send message, too many attempts");
            return {ok: false};
        }

        result = await TGSend(text, link, image_path);

        if (result.ok === false) {
            if (result.err.error_code === 429) {
                await sleep(4000);
                continue;
            }

            errorLog("Telegram API error: ", result.err);
            return {ok: false};
        }

        break;
    }

    const photoId = result.body.result.photo[2].file_id;

    result = await getImageUrl(photoId);

    if (result.ok) {
        return result;
    } else {
        errorLog("Telegram API error, cannot get image URL", result.err)
        return {ok: true, imageUrl: null}
    }
}

function makeOrderMessage(title, deadline, price, sizeText, serviceName, serviceRef, tgDescription) {
    if(sizeText !== 'не указано') sizeText += ' знаков';

    return encodeURI(`<b>${title}</b>\n\n<b>Оплата: </b>${price}\n<b>Объем текста: </b>${sizeText}\n<b>Срок:</b> ${deadline}\n<b>Источник:</b> <a href="${serviceRef}">${serviceName}</a>\n\n${tgDescription}`);
}

async function TGSend(text, link, image_path) {
    const options = {
        headers: {
            "Content-Type": "multipart/form-data"
        },
        multipart: true,
        json: true
    }

    const data = {
        photo: {file: image_path, content_type: 'image/jpg'}
    }

    let reply_markup = encodeURIComponent(JSON.stringify({
        inline_keyboard: [
            [{text: 'Забрать заказ', url: link}],
        ]
    }));

    return await needle('get', `https://api.telegram.org/bot${TOKEN}/sendPhoto?parse_mode=HTML&disable_web_page_preview=true&chat_id=${CHANNEL_ID}&caption=${text}&reply_markup=${reply_markup}`, data, options)
        .then((res) => {
            if (res.body.ok === false) {
                return {ok: false, err: res.body};
            }

            return {ok: true, body: res.body}
        }).catch((err) => {
            return {ok: false, err: err}
        })
}

async function getImageUrl(photoId) {
    return await needle('get', `https://api.telegram.org/bot${TOKEN}/getFile?file_id=${photoId}`, {json: true})
        .then((res) => {
            if (res.body.ok === false) {
                return {ok: false, err: res.body, imageUrl: false}
            }

            const imageUrl = `https://api.telegram.org/file/bot${TOKEN}/${res.body.result.file_path}`;

            return {ok: true, imageUrl}
        }).catch((err) => {
            return {ok: false, err, imageUrl: false}
        })
}