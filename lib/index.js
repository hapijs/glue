'use strict';

const Path = require('path');

const Hapi = require('@hapi/hapi');
const Hoek = require('@hapi/hoek');
const Validate = require('@hapi/validate');
const MoWalk = require('mo-walk');

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

    const serverOpts = await internals.parseServer(manifest.server ?? {}, options.relativeTo);
    const server = Hapi.server(serverOpts);

    if (options.preRegister) {
        await options.preRegister(server);
    }

    if (manifest.register?.plugins) {
        const plugins = await Promise.all(manifest.register.plugins.map((plugin) => {

            return internals.parsePlugin(plugin, options.relativeTo);
        }));

        await server.register(plugins, manifest.register.options ?? {});
    }

    return server;
};


internals.parseServer = async function (serverOpts, relativeTo) {

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
            let provider = item.provider.constructor;
            provider = await internals.requireRelativeTo(provider, relativeTo);
            item.provider.constructor = provider?.Engine ?? provider;
        }

        caches.push(item);
    }

    serverOpts.cache = caches;

    return serverOpts;
};


internals.parsePlugin = async function (plugin, relativeTo) {

    if (typeof plugin === 'string') {
        return await internals.requireRelativeTo(plugin, relativeTo);
    }

    if (typeof plugin.plugin === 'string') {
        const pluginObject = Hoek.clone(plugin, { shallow: ['options'] });
        pluginObject.plugin = await internals.requireRelativeTo(plugin.plugin, relativeTo);
        return pluginObject;
    }

    return plugin;
};


internals.requireRelativeTo = async function (path, relativeTo) {

    if (path[0] === '.') {
        path = Path.join(relativeTo ?? __dirname, path);
    }

    const result = await MoWalk.tryToResolve(path);
    Hoek.assert(result, `Glue could not resolve a module at ${path}`);

    return MoWalk.getDefaultExport(...result);
};
