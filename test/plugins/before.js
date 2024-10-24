'use strict';

exports.register = function (server, options) {

    server.expose('exists', true);
};

exports.name = 'before';

exports.multiple = false;
