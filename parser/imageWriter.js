const Jimp = require('jimp');
const stringWidth = require('string-pixel-width');

let bannerNumber = 1;

module.exports.createTGImageWithText = async (title, price, deadline, sizeText, serviceName) => {
    bannerNumber === 4 ? bannerNumber = 1 : bannerNumber++;
    const BANNER_PATH = `./parser/assets/images/postBannersTemplates/banner_${bannerNumber}.jpg`;
    const TEMP_PATH = `./parser/assets/images/postBannersTemplates/temp/banner_${bannerNumber}_${price}_${Date.now()}.jpg`;

    let logo;
    let logoX, logoY;

    if(serviceName === 'text.ru'){
        logo = './parser/assets/images/servicesLogos/textru.png';
        logoX = 555;
        logoY = 471;
    }else if(serviceName === 'etxt.ru'){
        logo = './parser/assets/images/servicesLogos/etxtru.png';
        logoX = 555;
        logoY = 471;
    }else if(serviceName === 'advego.com'){
        logo = './parser/assets/images/servicesLogos/advego.png';
        logoX = 555;
        logoY = 471;
    }


    let loadedBanner;
    let loadedLogo;
    let deadlinePos = {}, sizePos = {}, pricePos = {};

    deadlinePos.y = 373;
    deadlinePos.x = 636 - (stringWidth(deadline, {font: 'open sans', size: 32, bold: true}) / 2);
    sizePos.y = 471;
    sizePos.x = 910 - (stringWidth(sizeText, {font: 'open sans', size: 32, bold: true}) / 2);
    pricePos.y = 271;
    pricePos.x = 917 - (stringWidth(price, {font: 'open sans', size: 32, bold: true}) / 2);

    if(logo){
        loadedLogo = await Jimp.read(logo);
    }

    return await Jimp.read(BANNER_PATH)
        .then(function (image) {
            loadedBanner = image;
            return Jimp.loadFont('./parser/assets/fonts/opensans.fnt');
        })
        .then(async function (font) {
            if (loadedLogo) {
                loadedBanner.composite(loadedLogo, logoX,  logoY, {
                    mode: Jimp.BLEND_SOURCE_OVER,
                });
            }

            loadedBanner
                .print(font, deadlinePos.x, deadlinePos.y, deadline)
                .print(font, sizePos.x, sizePos.y, sizeText)
                .print(font, pricePos.x, pricePos.y, price);

            await loadedBanner.writeAsync(TEMP_PATH);
            return {ok: "true", TEMP_PATH}
        })
        .catch(function (err) {
            return {ok: "false", err}
        });
}