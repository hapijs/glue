'use strict';
// Load modules

const Path = require('path');
const Hapi = require('hapi');
const Hoek = require('hoek');
const Items = require('items');
const Joi = require('joi');


// Declare internals

const internals = {};


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

    const options = arguments.length === 2 ? {} : arguments[1];
    const callback = arguments.length === 2 ? arguments[1] : arguments[2];

    Hoek.assert(typeof callback === 'function', 'Invalid callback');
    Joi.assert(options, internals.schema.options, 'Invalid options');
    Joi.assert(manifest, internals.schema.manifest, 'Invalid manifest');

    // Create server

    const serverOpts = internals.parseServer(manifest.server || {}, options.relativeTo);
    const server = new Hapi.Server(serverOpts);

    const steps = [];
    steps.push((next) => {

        if (options.preConnections) {
            options.preConnections(server, next);
        }
        else {
            next();
        }
    });

    steps.push((next) => {

        // Load connections

        if (manifest.connections) {
            manifest.connections.forEach((connection) => {

                server.connection(connection);
            });
        }
        else {
            server.connection();
        }

        next();
    });

    steps.push((next) => {

        if (options.prePlugins) {
            options.prePlugins(server, next);
        }
        else {
            next();
        }
    });

    steps.push((next) => {

        // Load plugins

        let plugins = [];
        let parsed;

        if (Array.isArray(manifest.plugins)) {
            for (let i = 0; i < manifest.plugins.length; ++i) {
                const pluginObject = manifest.plugins[i];
                const keys = Object.keys(pluginObject);

                Hoek.assert(keys.length === 1, 'Invalid plugin config');

                parsed = internals.parsePlugin(keys[0], pluginObject[keys[0]], options.relativeTo);
                plugins = plugins.concat(parsed);
            }
        }
        else {
            Object.keys(manifest.plugins || {}).forEach((name) => {

                parsed = internals.parsePlugin(name, manifest.plugins[name], options.relativeTo);
                plugins = plugins.concat(parsed);
            });
        }

        Items.serial(plugins, (plugin, nextRegister) => {

            server.register(plugin.module, plugin.apply, nextRegister);
        }, next);
    });

    Items.serial(steps, (step, nextStep) => {

        step(nextStep);
    }, (err) => {

        if (err) {
            return callback(err);
        }

        callback(null, server);
    });
};


internals.parseServer = function (server, relativeTo) {

    if (server.cache) {
        server = Hoek.clone(server);

        const caches = [];
        const config = [].concat(server.cache);

        for (let i = 0; i < config.length; ++i) {
            let item = config[i];
            if (typeof item === 'string') {
                item = { engine: item };
            }
            if (typeof item.engine === 'string') {
                let strategy = item.engine;
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

    let path = name;
    if (relativeTo && path[0] === '.') {
        path = Path.join(relativeTo, path);
    }

    if (Array.isArray(plugin)) {
        const plugins = [];

        Hoek.assert(plugin.length > 0, 'Invalid plugin configuration');

        plugin.forEach((instance) => {

            Hoek.assert(typeof instance === 'object', 'Invalid plugin configuration');

            const registerOptions = Hoek.cloneWithShallow(instance, 'options');
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
