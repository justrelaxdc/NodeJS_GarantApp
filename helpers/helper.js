const fs = require('fs');
const path = require('path');

module.exports.sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports.cleanFolder = (directory) => {
    fs.readdir(directory, (err, files) => {
        if (err) throw err;

        for (const file of files) {
            fs.unlink(path.join(directory, file), err => {
                if (err) throw err;
            });
        }
    });
}

module.exports.getCurrentTimeUTC = () => {
    let currentDate = new Date() // Current date as string

    currentDate = currentDate.toISOString();
    currentDate = currentDate.replace(/\..+/, ''); // delete the dot and everything after
    currentDate += "+00:00"; // Add UTC time zone
    return currentDate;
}

module.exports.addSecondToTimeUTC = (stringTime, seconds) => {
    let time = new Date(stringTime);
    time.setSeconds(time.getSeconds() + seconds);
    return time.toISOString().replace(/\..+/, '') + "+00:00";
}

module.exports.firstLetterCapital = (text) => {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

module.exports.bbcodeParse = (text) => {
    text = text.split("[BR]").join("\n");
    text = text.split("[B]").join("<b>");
    text = text.split("[/B]").join("</b>");
    text = text.split("[/LI]").join("\n");
    text = text.replace(/\[\/?(?:b|i|u|url|quote|code|img|color|size)*?.*?\]/img, ''); // clear phpbb
    return text;
}

module.exports.reverseDate = (date) => { // From 10.11.2020 to 2020.10.11
    return date.slice(6, 11) + '-' + date.slice(3, 5) + '-' + date.slice(0, 2);
}

module.exports.isInt = (value) => {
    let x;
    if (isNaN(value)) {
        return false;
    }
    x = parseFloat(value);
    return (x | 0) === x;
}

module.exports.getDateFromTime = (time) => {
    time = time.split("-").join(".");
    time = time.slice(0, time.indexOf('T'))
    return time;
}