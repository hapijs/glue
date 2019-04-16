'use strict';

exports.register = function (server, options) {

    server.route({
        method: 'GET',
        path: 'plugin',
        handler: function (request, h) {

            return 'ok';
        }
    });
};

exports.name = 'route';

exports.multiple = true;
