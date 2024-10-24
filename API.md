
## Introduction

### A server composer for hapi.js.

Glue provides configuration based composition of hapi's Server object. Specifically it wraps

 * `server = Hapi.server(Options)`
 * `server.register(Plugins, Options)`

calling each based on the configuration generated from the glue manifest.

### hapi version dependency

Version 9 supports hapi **v20 and v21** as a peer dependency.
Version 8 supports hapi **v20**
Version 7 supports hapi **v19**
Version 6 supports hapi **v18**
Version 5 supports hapi **v17**

As of glue v9, hapi is treated as a peer dependency.  It's recommended to include hapi in your package dependencies alongside of glue, however if you're using npm v7+ then peer dependencies are automatically installed.

## Interface

Glue exports a single function `compose` accepting a JSON `manifest` specifying the hapi server options and plugin registrations and returns a [hapi](https://hapi.dev/api) server object.
To start the server use the returned object to call `await server.start()`.

### `await compose(manifest, [options])`

Composes a hapi server object where:
+ `manifest` - an object having:
  * `server` - an object containing the options passed to [hapi's](https://hapijs.com/api) `new Hapi.Server([options])`
    + If `server.cache` is specified, glue will parse the entry and replace any prototype function field (eg. `provider`) specified as string by calling `require()` with that string.
  * `register` - an object containing two properties: the `plugins` to be registered and `options` to pass to `server.register`
    + `plugins` - an array of entries to register with [hapi's](https://hapijs.com/api) `await server.register(plugins, [options])`
      * each entry may be one of three alternatives:
        1. A string to be `require()`d during composition.
        ```js
        {
          register: {
            plugins: [ 'myplugin' ]
          }
        }
        ```
        2. An object containing the `plugin` property which is a string to be `require`d during composition
        ```js
        {
          register: {
            plugins: [ { plugin: 'myplugin' } ]
          }
        }
        ```
        3. An object containing the `plugin` property which is the plugin object to be passed directly to `await server.register`*[]:
        ```js
        {
          register: {
            plugins: [ { plugin: require('myplugin') } ]
          }
        }
        ```
      * object entries may also contain the `options` property, which contains the plugin-level options passed to the plugin at registration time.
      ```js
      {
        register: {
          plugins: [ { plugin: 'myplugin', options: { host: 'my-host.com' } } ]
        }
      }
      ```
      * object entries may also contain override registration-options such as `routes`.
      ```js
      {
        register: {
          plugins: [ { plugin: 'myplugin', routes: { prefix: '/test/' } } ]
        }
      }
      ```
    + `options` - optional registration-options object passed to `server.register()`.
+ `options` - an object containing the following `compose` options:
  * `relativeTo` - a file-system path string that is used to resolve loading modules with `require`.  Used in `server.cache` and `register.plugins[]`
  * `preRegister` - an async function that is called prior to registering plugins with the server. The function signature is `async function (server)` where:
    + `server` - is the hapi server object.

`compose` returns the hapi server object. Call `await server.start()` to actually start the server.

### Notes

If you are developing a plugin, ensure your plugin dependencies are properly managed to guarantee that all dependencies are loaded before your plugin registration completes.  See [hapi's](https://hapi.dev/api) `server.dependency(dependencies, [after])` for more information.

If you need to sort the plugins before registration, you can do so by adding `before` and `after` to the plugin object.  The `before` and `after` properties are a plugin name or arrays of plugin names that the plugin should be placed before or after.

```js
{
    register: {
        plugins: [
            { plugin: 'myplugin', before: ['anotherplugin'] },
            { plugin: 'anotherplugin', after: ['myplugin'] }
        ]
    }
}
```

## Usage

```javascript
'use strict';

const Glue = require('@hapi/glue');

const manifest = {
    server: {
        cache: 'redis',
        port: 8000
    },
    register: {
        plugins: [
            './awesome-plugin.js',
            {
                plugin: require('myplugin'),
                options: {
                    uglify: true
                }
            },
            {
                plugin: './ui-user'
            },
            {
                plugin: './ui-admin',
                options: {
                    sessiontime: 500
                },
                routes: {
                    prefix: '/admin'
                }
            }
        ],
        options: {
            once: false
        }
    }
};

const options = {
    relativeTo: __dirname
};

const startServer = async function () {
    try {
        const server = await Glue.compose(manifest, options);
        await server.start();
        console.log('hapi days!');
    }
    catch (err) {
        console.error(err);
        process.exit(1);
    }
};

startServer();
```

The above is translated into the following equivalent hapi API calls.

```javascript
'use strict';

const Hapi = require('@hapi/hapi');

const startServer = async function () {
    try {
        const server = Hapi.server({ cache: [{ provider: require('redis') }], port: 8000 });
        const plugins = [];
        const registerOptions = { once: false };
        let pluginPath;

        pluginPath = Path.join(__dirname, './awesome-plugin.js');
        plugins.push({ plugin: require(pluginPath) });

        plugins.push({ plugin: require('myplugin'), options:{ uglify: true } });

        pluginPath = Path.join(__dirname, './ui-user');
        plugins.push({ plugin: require(pluginPath) });

        pluginPath = Path.join(__dirname, './ui-admin');
        plugins.push({ plugin: require(pluginPath), options: { sessiontime: 500 }, routes: { prefix: '/admin' } });

        await server.register(plugins, registerOptions);

        await server.start();
        console.log('hapi days!');
    }
    catch (err) {
        console.error(err);
        process.exit(1);
    }
};

startServer();
```
