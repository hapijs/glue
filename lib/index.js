// Load modules

var Path = require('path');
var Hapi = require('hapi');
var Hoek = require('hoek');
var Items = require('items');
var Joi = require('joi');


// Declare internals

var internals = {};


internals.schema = {
    options: Joi.object({
        relativeTo: Joi.string(),
        preConnections: Joi.func().allow(false),
        prePlugins: Joi.func().allow(false)
    }),
    manifest: Joi.object({
        server: Joi.object(),
        connections: Joi.array().min(1),
        plugins: [Joi.object(), Joi.array()]
    })
};


exports.compose = function (manifest /*, [options], callback */) {

    var options = arguments.length === 2 ? {} : arguments[1];
    var callback = arguments.length === 2 ? arguments[1] : arguments[2];

    Hoek.assert(typeof callback === 'function', 'Invalid callback');
    Joi.assert(options, internals.schema.options, 'Invalid options');
    Joi.assert(manifest, internals.schema.manifest, 'Invalid manifest');

    // Create server

    var serverOpts = internals.parseServer(manifest.server || {}, options.relativeTo);
    var server = new Hapi.Server(serverOpts);

    var steps = [];
    steps.push(function (next) {

        if (options.preConnections) {
            options.preConnections(server, next);
        }
        else {
            next();
        }
    });

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

        if (options.prePlugins) {
            options.prePlugins(server, next);
        }
        else {
            next();
        }
    });

    steps.push(function (next) {

        // Load plugins

        var plugins = [];
        var parsed;

        if (Array.isArray(manifest.plugins)) {
            for (var i = 0, l = manifest.plugins.length; i < l; i++) {
                var pluginObject = manifest.plugins[i];
                var keys = Object.keys(pluginObject);

                Hoek.assert(keys.length === 1, 'Invalid plugin config');

                parsed = internals.parsePlugin(keys[0], pluginObject[keys[0]], options.relativeTo);
                plugins = plugins.concat(parsed);
            }
        }
        else {
            Object.keys(manifest.plugins || {}).forEach(function (name) {

                parsed = internals.parsePlugin(name, manifest.plugins[name], options.relativeTo);
                plugins = plugins.concat(parsed);
            });
        }

        Items.serial(plugins, function (plugin, nextRegister) {

            server.register(plugin.module, plugin.apply, nextRegister);
        }, next);
    });

    Items.serial(steps, function (step, nextStep) {

        step(nextStep);
    }, function (err) {

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
            if (typeof item === 'string') {
                item = { engine: item };
            }
            if (typeof item.engine === 'string') {
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

        Hoek.assert(plugin.length > 0, 'Invalid plugin configuration');

        plugin.forEach(function (instance) {

            Hoek.assert(typeof instance === 'object', 'Invalid plugin configuration');

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
