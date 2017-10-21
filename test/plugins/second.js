'use strict';

exports.register = function (server, options) {

    server.route({
        method: 'GET',
        path: 'second',
        handler: function (request, h) {

            return options.value || 'ok';
        }
    });
};

exports.name = 'second';
exports.multiple = true;
