async function routes(fastify, options) {
    fastify.get('/', function (request, reply) {
        reply.send(`Bot API works!`);
    });
}

module.exports = routes;