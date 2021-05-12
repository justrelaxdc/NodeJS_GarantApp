const vacanciesModel = require('../../models/vacancies');
const {errorLog} = require('../../helpers/logger');

module.exports.getDataOrdersAdmin = async () => {
    let data = {};

    data.vacancies = await vacanciesModel.find({});

    return data;
}