'use strict';

exports.register = function (server, options, next) {

    server.route({
        method: 'GET',
        path: 'plugin',
        handler: function (request, reply) {

            reply();
        }
    });
    next();
};

exports.register.attributes = {
    name: 'route',
    multiple: true
};
