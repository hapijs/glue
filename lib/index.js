// Load modules

var Path = require('path');
var Hoek = require('hoek');
var Items = require('items');
var Joi = require('joi');


// Declare internals

var internals = {};


internals.schema = Joi.object({
    pack: Joi.object({
        app: Joi.object().allow(null),
        debug: Joi.object({
            request: Joi.array().allow(false)
        }).allow(false),
        cache: Joi.alternatives([
            Joi.string(),
            Joi.object(),
            Joi.func(),
            Joi.array().includes(Joi.object()).min(1)
        ]).allow(null)
    }),
    servers: Joi.array().required().min(1),
    plugins: Joi.object()
});


/*
var config1 = {
    pack: {
        cache: 'redis',
        app: {
            'app-specific': 'value'
        }
    },
    servers: [
        {
            port: 8001,
            options: {
                labels: ['api', 'nasty']
            }
        },
        {
            host: 'localhost',
            port: '$env.PORT',
            options: {
                labels: ['api', 'nice']
            }
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

exports.compose = function (Hapi) {

    return function (manifest /*, [options], callback */) {

        var options = arguments.length === 2 ? {} : arguments[1];
        var callback = arguments.length === 2 ? arguments[1] : arguments[2];

        // Create pack

        Hoek.assert(options, 'Invalid options');
        Hoek.assert(typeof callback === 'function', 'Invalid callback');

        Joi.assert(manifest, internals.schema, 'Invalid manifest options');

        var packSettings = manifest.pack || {};
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

        var pack = new Hapi.Pack(packSettings);

        // Load servers

        manifest.servers.forEach(function (server) {

            if (typeof server.port === 'string') {
                server.port = parseInt(server.port, 10);
            }

            pack.server(server.host, server.port, server.options);
        });

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
                            plugin: require(path),
                            options: instance.options
                        },
                        apply: registerOptions
                    });
                });
            }
            else {
                plugins.push({
                    module: {
                        plugin: require(path),
                        options: item
                    },
                    apply: {}
                });
            }

            Items.serial(plugins, function (plugin, nextRegister) {


                pack.register(plugin.module, plugin.apply, nextRegister);
            }, nextName);
        },
        function (err) {

            if (err) {
                return callback(err);
            }

            return callback(err, pack);
        });
    };
};
