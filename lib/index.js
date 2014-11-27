// Load modules

var Path = require('path');
var Hapi = require('hapi');
var Hoek = require('hoek');
var Items = require('items');
var Joi = require('joi');


// Declare internals

var internals = {};


internals.schema = Joi.object({
    server: Joi.object(),
    connections: Joi.array().min(1),
    plugins: Joi.object()
});


/*
var config1 = {
    server: {
        cache: 'redis',
        app: {
            'app-specific': 'value'
        }
    },
    connections: [
        {
            port: 8001,
            labels: ['api', 'nasty']
        },
        {
            host: 'localhost',
            port: '$env.PORT',
            labels: ['api', 'nice']
        }
    ],
    plugins: {
        furball: {
            version: false,
            plugins: '/'
        },
        other: [
            {
                select: ['b'],
                options: {
                    version: false,
                    plugins: '/'
                }
            }
        ]
    }
};
*/

exports.compose = function (manifest /*, [options], callback */) {

    var options = arguments.length === 2 ? {} : arguments[1];
    var callback = arguments.length === 2 ? arguments[1] : arguments[2];

    Hoek.assert(options, 'Invalid options');
    Hoek.assert(typeof callback === 'function', 'Invalid callback');

    Joi.assert(manifest, internals.schema, 'Invalid manifest options');

    // Create server

    var serverOpts = internals.parseServer(manifest.server || {}, options.relativeTo);
    var server = new Hapi.Server(serverOpts);

    var steps = [];
    steps.push(function (next) {

        // Load connections

        if (manifest.connections) {
            manifest.connections.forEach(function (connection) {

                server.connection(connection);
            });
        }
        else {
            server.connection();
        }
        next();
    });

    steps.push(function (next) {

        // Load plugins

        var plugins = [];

        Object.keys(manifest.plugins || {}).forEach(function (name) {
            var plugin = internals.parsePlugin(name, manifest.plugins[name], options.relativeTo);
            plugins = plugins.concat(plugin);
        });

        Items.serial(plugins, function (plugin, nextRegister) {

            server.register(plugin.module, plugin.apply, nextRegister);
        }, next);
    });

    Items.serial(steps, function (step, nextStep) {

        step(nextStep);
    },
    function (err) {

        if (err) {
            return callback(err);
        }

        callback(null, server);
    });
};

internals.parseServer = function (server, relativeTo) {
    if (server.cache) {
        server = Hoek.clone(server);

        var caches = [];
        var config = [].concat(server.cache);

        for (var i = 0, il = config.length; i < il; ++i) {
            var item = config[i];
            if (typeof item === 'string' ||
                typeof item.engine === 'string') {

                if (typeof item === 'string') {
                    item = { engine: item };
                }

                var strategy = item.engine;
                if (relativeTo && strategy[0] === '.') {

                    strategy = Path.join(relativeTo, strategy);
                }

                item.engine = require(strategy);
            }

            caches.push(item);
        }

        server.cache = caches;
    }

    return server;
};

internals.parsePlugin = function (name, plugin, relativeTo) {

    var path = name;
    if (relativeTo && path[0] === '.') {

        path = Path.join(relativeTo, path);
    }

    if (Array.isArray(plugin)) {
        var plugins = [];

        plugin.forEach(function (instance) {

            var registerOptions = Hoek.cloneWithShallow(instance, 'options');
            delete registerOptions.options;

            plugins.push({
                module: {
                    register: require(path),
                    options: instance.options
                },
                apply: registerOptions
            });
        });

        return plugins;
    }

    return {
        module: {
            register: require(path),
            options: plugin
        },
        apply: {}
    };
};
