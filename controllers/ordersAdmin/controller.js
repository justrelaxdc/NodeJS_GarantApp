const {getDataOrdersAdmin} = require('./model');
const path = require('path');

async function routes(fastify, options) {
    fastify.register(require('fastify-static'), {
        root: path.join(__dirname, 'src')
    })

    fastify.get('/', async (request, reply) => {
        let data = await getDataOrdersAdmin();

        reply.view('controllers/ordersAdmin/view/index.ejs', { data })
    });
}

module.exports = routes;