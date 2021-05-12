const {errorLog} = require('../helpers/logger');
const wc = require("@woocommerce/woocommerce-rest-api").default;

const api = new wc({
    url: "https://webdiscount.ru",
    consumerKey: "ck_32e87dadad49400af6e1e92740338386e1aaff09",
    consumerSecret: "cs_397118c82190f1f85436658b552f10398e6a4b75",
    version: "wc/v3"
});

module.exports.addPost = async (title, text, price, imageUrl, link) => {
    return {ok: true};

    const images = imageUrl ? [{"src": imageUrl}] : [];

    const body = {
        name: title,
        type: "simple",
        regular_price: price + ".00",
        description: text,
        categories: [
            {
                id: 90
            }
        ],
        images,
        meta_data: [
            {key: 'orderLink', value: link}
        ]
    }

    return await api.post("products", body)
        .then((res) => {
            return {ok: true};
        })
        .catch((err) => {
            errorLog("WP API error: ", err);
            return {ok: false};
        });
}