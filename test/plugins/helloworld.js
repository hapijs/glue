'use strict';

exports.register = function (server, options, next) {

    server.expose('hello', options.who || 'world');
    next();
};

exports.register.attributes = {
    name: 'helloworld',
    multiple: false
};
