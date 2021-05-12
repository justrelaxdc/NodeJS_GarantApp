async function routes(fastify, options) {
    fastify.get('/', function (request, reply) {
        reply.send(`Nothing to show!`);
    });
}

module.exports = routes;