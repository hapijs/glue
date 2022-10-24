'use strict';

exports.register = function (server, options) {

    server.expose('hello', options.who ?? 'world');
};

exports.name = 'helloworld';

exports.multiple = false;
