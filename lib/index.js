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

    // Create server

    Hoek.assert(options, 'Invalid options');
    Hoek.assert(typeof callback === 'function', 'Invalid callback');

    Joi.assert(manifest, internals.schema, 'Invalid manifest options');

    var packSettings = manifest.server || {};
    if (packSettings.cache) {
        packSettings = Hoek.clone(packSettings);

        var caches = [];
        var config = [].concat(packSettings.cache);

        for (var i = 0, il = config.length; i < il; ++i) {
            var item = config[i];
            if (typeof item === 'string' ||
                typeof item.engine === 'string') {

                if (typeof item === 'string') {
                    item = { engine: item };
                }

                var strategy = item.engine;
                if (options.relativeTo &&
                    strategy[0] === '.') {

                    strategy = Path.join(options.relativeTo, strategy);
                }

                item.engine = require(strategy);
            }

            caches.push(item);
        }

        packSettings.cache = caches;
    }

    var server = new Hapi.Server(packSettings);

    // Load connections

    if (manifest.connections) {
        manifest.connections.forEach(function (connection) {

            server.connection(connection);
        });
    }
    else {
        server.connection();
    }

    // Load plugin

    var names = Object.keys(manifest.plugins);
    Items.serial(names, function (name, nextName) {

        var item = manifest.plugins[name];
        var path = name;
        if (options.relativeTo &&
            path[0] === '.') {

            path = Path.join(options.relativeTo, path);
        }

        /*
            simple: {
                key: 'value'
            },
            custom: [
                {
                    select: ['b'],
                    options: {
                        key: 'value'
                    }
                }
            ]
        */

        var plugins = [];
        if (Array.isArray(item)) {
            item.forEach(function (instance) {

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
        }
        else {
            plugins.push({
                module: {
                    register: require(path),
                    options: item
                },
                apply: {}
            });
        }

        Items.serial(plugins, function (plugin, nextRegister) {

            server.register(plugin.module, plugin.apply, nextRegister);
        }, nextName);
    },
    function (err) {

        if (err) {
            return callback(err);
        }

        return callback(err, server);
    });
};
