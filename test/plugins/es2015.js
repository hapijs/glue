'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
const register = function (server, options, next) {

    server.expose('loaded', true);
    next();
};

register.attributes = {
    name: 'es2015',
    multiple: false
};

exports.default = {
    register: register
};
