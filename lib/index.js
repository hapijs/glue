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
        preRegister: Joi.func().allow(false)
    }),
    manifest: Joi.object({
        server: Joi.object(),
        connections: Joi.array().items(Joi.object()),
        registrations: Joi.array().items(Joi.object({
            plugin: [
                Joi.string(),
                Joi.object({ register: Joi.string() }).unknown()
            ],
            options: Joi.object()
        }))
    })
};


exports.compose = function (manifest /*, [options], [callback] */) {

    Hoek.assert(arguments.length <= 3, 'Invalid number of arguments');

    const options = arguments.length === 1 || typeof arguments[1] === 'function' ? {} : arguments[1];
    const callback = typeof arguments[arguments.length - 1] === 'function' ? arguments[arguments.length - 1] : null;

    Joi.assert(options, internals.schema.options, 'Invalid options');
    Joi.assert(manifest, internals.schema.manifest, 'Invalid manifest');

    // Return Promise if no callback provided

    if (!callback) {
        return new Promise((resolve, reject) => {

            exports.compose(manifest, options, (err, server) => {

                if (err) {
                    return reject(err);
                }

                return resolve(server);
            });
        });
    }

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

        if (manifest.connections && manifest.connections.length > 0) {
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

        if (options.preRegister) {
            options.preRegister(server, next);
        }
        else {
            next();
        }
    });

    steps.push((next) => {

        // Load registrations

        if (manifest.registrations) {
            const registrations = manifest.registrations.map((reg) => {

                return {
                    plugin: internals.parsePlugin(reg.plugin, options.relativeTo),
                    options: reg.options || {}
                };
            });
            Items.serial(registrations, (reg, nextRegister) => {

                server.register(reg.plugin, reg.options, nextRegister);
            }, next);
        }
        else {
            next();
        }
    });

    Items.serial(steps, (step, nextStep) => {

        step(nextStep);
    }, (err) => {

        if (err) {
            return Hoek.nextTick(callback)(err);
        }

        Hoek.nextTick(callback)(null, server);
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


internals.parsePlugin = function (plugin, relativeTo) {

    plugin = Hoek.cloneWithShallow(plugin, ['options']);
    if (typeof plugin === 'string') {
        plugin = { register: plugin };
    }

    let path = plugin.register;
    if (relativeTo && path[0] === '.') {
        path = Path.join(relativeTo, path);
    }

    plugin.register = require(path);
    return plugin;
};
