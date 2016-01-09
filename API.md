
## Interface

Glue exports a single function `compose` accepting a JSON `manifest` file specifying the hapi server options, connections, and registrations.

### `compose(manifest, [options], [callback])`

Composes a hapi server object where:
+ `manifest` - an object having:
  * `server` - an object containing the options passed to [new Hapi.Server([options])](http://hapijs.com/api#new-serveroptions)
    + If `server.cache` is specified, Glue will parse the entry and replace any prototype function field (eg. `engine`) specified as string by calling `require()` with that string.
  * `connections` - an array of connection options objects that are mapped to calls of [server.connection([options])](http://hapijs.com/api#serverconnectionoptions)
  * `registrations` - an array of objects holding entries to register with [server.register(plugin, [options], callback)](http://hapijs.com/api#serverregisterplugins-options-callback).  Each object has two fields that map directly to the `server.register` named parameters:
    + `plugin` - Glue will parse the entry and replace any plugin function field specified as a string by calling `require()` with that string. The array form of this parameter accepted by `server.register()` is not allowed; use multiple registration objects instead.
    + `options` - optional option object passed to `server.register()`.
+ `options` - an object having
  * `relativeTo` - a file-system path string that is used to resolve loading modules with `require`.  Used in `server.cache` and `registrations[].plugin`
  * `preConnections` - a callback function that is called prior to adding connections to the server. The function signature is `function (server, next)` where:
    + `server` - is the server object returned from `new Server(options)`.
    + `next`- the callback function the method must call to return control over to glue
  * `preRegister` - a callback function that is called prior to registering plugins with the server. The function signature is `function (server, next)` where:
    + `server` - is the server object with all connections selected.
    + `next`- the callback function the method must call to return control over to glue
+ `callback` - the callback function with signature `function (err, server)` where:
  * `err` - the error response if a failure occurred, otherwise `null`.
  * `server` - the server object. Call `server.start()` to actually start the server.

If no `callback` is provided, a `Promise` object is returned where the value passed to the Promise resolve handler is the `server` object and the value passed to the Promise reject handler is the error response if a failure occurred.

### Notes

If you are developing a plugin, ensure your plugin dependencies are properly managed to guarantee that all dependencies are loaded before your plugin registration completes.  See [`server.dependency(dependencies, [after])`](http://hapijs.com/api#serverdependencydependencies-after) for more information.

## Usage

```javascript
'use strict';

const Glue = require('glue');

const manifest = {
    server: {
        cache: 'redis'
    },
    connections: [
        {
            port: 8000,
            labels: ['web']
        },
        {
            port: 8001,
            labels: ['admin']
        }
    ],
    registrations: [
        {
            plugin: {
                register: './assets',
                options: {
                    uglify: true
                }
            }
        },
        {
            plugin: './ui-user',
            options: {
                select: ['web']
            }
        },
        {
            plugin: {
                register: './ui-admin',
                options: {
                    sessiontime: 500
                }
            },
            options: {
                select: ['admin'],
                routes: {
                    prefix: '/admin'
                }
            }
        }
    ]
};

const options = {
    relativeTo: __dirname
};

Glue.compose(manifest, options, (err, server) => {

    if (err) {
        throw err;
    }
    server.start(() => {

        console.log('hapi days!');
    });
});
```

The above is translated into the following equivalent hapi API calls.

```javascript
'use strict';

const server = Hapi.Server({ cache: [{ engine: require('redis') }] });
server.connection({ port: 8000, labels: ['web'] });
server.connection({ port: 8001, labels: ['admin'] });
let plugin;
let pluginPath;
let pluginOptions;
let registerOptions;
pluginPath = Path.join(__dirname, './assets');
pluginOptions = { uglify: true };
plugin = { register: require(pluginPath), options: pluginOptions };
registerOptions = { };
server.register(plugin, registerOptions, (err) => {

    if (err) {
        throw err;
    }
    pluginPath = Path.join(__dirname, './ui-user');
    pluginOptions = { };
    plugin = { register: require(pluginPath), options: pluginOptions };
    registerOptions = { select: ['web'] };
    server.register(plugin, registerOptions, (err) => {

        if (err) {
            throw err;
        }
        pluginPath = Path.join(__dirname, './ui-admin');
        pluginOptions = { sessiontime: 500 };
        plugin = { register: require(pluginPath), options: pluginOptions };
        registerOptions = { select: ['admin'], routes: { prefix: '/admin' } };
        server.register(plugin, registerOptions, (err) => {

            if (err) {
                throw err;
            }
            server.start(() => {

                console.log('hapi days!');
            });
        });
    });
});
```
