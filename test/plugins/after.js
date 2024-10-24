'use strict';

const Assert = require('assert');

exports.register = function (server, options) {

    Assert(server.plugins.before.exists, 'before plugin should be registered before this plugin');
    server.expose('exists', true);
};

exports.name = 'after';

exports.multiple = false;
