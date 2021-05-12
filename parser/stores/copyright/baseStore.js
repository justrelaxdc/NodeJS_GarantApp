module.exports = class BaseStore {
    static getCurrentTimeUTC() {
        let currentDate = new Date() // Current date as string

        currentDate = currentDate.toISOString();
        currentDate = currentDate.replace(/\..+/, ''); // delete the dot and everything after
        currentDate += "+00:00"; // Add UTC time zone
        return currentDate;
    }

    static addSecondToTimeUTC(stringTime, seconds) {
        let time = new Date(stringTime);
        time.setSeconds(time.getSeconds() + seconds);
        return time.toISOString().replace(/\..+/, '') + "+00:00";
    }

    static firstLetterCapital(text) {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    static bbcodeParse(text) {
        text = text.split("[BR]").join("\n");
        text = text.split("[B]").join("<b>");
        text = text.split("[/B]").join("</b>");
        text = text.split("[/LI]").join("\n");
        text = text.replace(/\[\/?(?:b|i|u|url|quote|code|img|color|size)*?.*?\]/img, ''); // clear phpbb
        return text;
    }

    static removeDublicatesFormOrdersList(list) {
        return list.filter((elem, index, self) => self.findIndex(
            (t) => {
                return (t.title === elem.title && t.price === elem.price)
            }) === index)
    }

    static reverseDate(date){ // From 10.11.2020 to 2020.10.11
        return date.slice(6, 11) + '-' + date.slice(3, 5) + '-' + date.slice(0, 2);
    }

    static prepareTextToTg(str, length){
        str = str.replace(/[\r\n]{2,}/g, "\n");
        
        if(str.length < length) return str;

        str = str.slice(0, length);

        let cutIndex = str.lastIndexOf('.');
        if(cutIndex === -1){
            cutIndex = str.lastIndexOf(' ');
        }

        str = str.slice(0, cutIndex) + '...\nБольше информации ⬇';

        return str;
    }
}