'use strict';

const Path = require('path');

const Hapi = require('@hapi/hapi');
const Hoek = require('@hapi/hoek');
const Validate = require('@hapi/validate');


const internals = {};


internals.schema = {
    options: Validate.object({
        relativeTo: Validate.string(),
        preRegister: Validate.func().allow(false)
    }),
    manifest: Validate.object({
        server: Validate.object(),
        register: Validate.object({
            plugins: Validate.array(),
            options: Validate.any()
        })
    })
};


exports.compose = async function (manifest, options = {}) {

    Validate.assert(options, internals.schema.options, 'Invalid options');
    Validate.assert(manifest, internals.schema.manifest, 'Invalid manifest');

    const serverOpts = internals.parseServer(manifest.server || {}, options.relativeTo);
    const server = Hapi.server(serverOpts);

    if (options.preRegister) {
        await options.preRegister(server);
    }

    if (manifest.register && manifest.register.plugins) {
        const plugins = manifest.register.plugins.map((plugin) => {

            return internals.parsePlugin(plugin, options.relativeTo);
        });

        await server.register(plugins, manifest.register.options || {});
    }

    return server;
};


internals.parseServer = function (serverOpts, relativeTo) {

    if (!serverOpts.cache) {
        return serverOpts;
    }

    serverOpts = Hoek.clone(serverOpts);

    const caches = [];
    const config = [].concat(serverOpts.cache);
    for (let item of config) {
        if (typeof item === 'string') {
            item = { provider: { constructor: item } };
        }
        else {
            if (typeof item.provider === 'string') {
                item.provider = { constructor: item.provider };
            }
        }

        if (typeof item.provider.constructor === 'string') {
            let strategy = item.provider.constructor;
            if (relativeTo &&
                strategy[0] === '.') {

                strategy = Path.join(relativeTo, strategy);
            }

            item.provider.constructor = require(strategy);
        }

        caches.push(item);
    }

    serverOpts.cache = caches;

    return serverOpts;
};


internals.parsePlugin = function (plugin, relativeTo) {

    if (typeof plugin === 'string') {
        return internals.requireRelativeTo(plugin, relativeTo);
    }

    if (typeof plugin.plugin === 'string') {
        const pluginObject = Hoek.clone(plugin, { shallow: ['options'] });
        pluginObject.plugin = internals.requireRelativeTo(plugin.plugin, relativeTo);

        return pluginObject;
    }

    return plugin;
};


internals.requireRelativeTo = function (path, relativeTo) {

    if (relativeTo && path[0] === '.') {
        path = Path.join(relativeTo, path);
    }

    return require(path);
};
