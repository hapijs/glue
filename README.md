# glue

Server composer for hapi.js.

[![Build Status](https://travis-ci.org/hapijs/glue.svg?branch=master)](https://travis-ci.org/hapijs/glue)

Lead Maintainer - [Chris Rempel](https://github.com/csrl)

## Interface

Glue exports a single function `compose` accepting a JSON `manifest` file specifying the Hapi server options, connections and plugins.  Glue primarily works in synergy with [Rejoice](https://github.com/hapijs/rejoice), but can be integrated directly into any Hapi application loader.

- `compose(manifest, [options], callback)`
  + `manifest` - an object having:
    * 'server' - an object containing the options passed to [`new Server([options])`](http://hapijs.com/api#new-serveroptions)
    * 'connections' - an array of connection options, passed individually in calls to [`server.connection([options])`](http://hapijs.com/api#serverconnectionoptions)
    * 'plugins' - an object or array of objects holding plugin entries to register with [`server.register(plugin, [options], callback)`](http://hapijs.com/api#serverregisterplugins-options-callback). Each object key is the `name` of the plugin to load and register and the value is one of:
      + an object to use as the plugin options which get passed to the plugin's registration function when called.
      + an array of objects where each object will load a separate instance of the plugin. Multiple instances of a plugin is only possible if supported by the plugin ie. the plugin is implemented with `attributes.multiple` as `true`. Each object can have:
        * any option from [`server.register`](http://hapijs.com/api#serverregisterplugins-options-callback) options
        * `options` - an object to use as the plugin options which get passed to the plugin's registration function when called.
  + `options` - an object having
    * 'relativeTo' - a file-system path string that is used to resolve loading modules with `require`.  Used in `server.cache` and `plugins[name]`
    * 'preConnections' - a callback function that is called prior to adding connections to the server. The function signature is `function (server, next)` where:
      + `server` - is the server object returned from `new Server(options)`.
      + `next`-  the callback function the method must call to return control over to glue
    * 'prePlugins' - a callback function that is called prior to registering plugins with the server. The function signature is `function (server, next)` where:
      + `server` - is the server object with all connections selected.
      + `next`-  the callback function the method must call to return control over to glue
  + `callback` - the callback function with signature `function (err, server)` where:
    * `err` - the error response if a failure occurred, otherwise `null`.
    * `server` - the server object. Call `server.start()` to actually start the server.

### Notes

When using an an object as the value for the `manifest.plugins` field, the order of plugin registration is not guaranteed. When using an array as the value, then the plugin registration order follows the array order. If you are developing a plugin, you should ensure your plugin dependencies are properly managed to guarantee that all dependencies are loaded before your plugin registration completes.  See [`server.dependency(dependencies, [after])`](http://hapijs.com/api#serverdependencydependencies-after) for more information.

## Usage

```javascript
var Glue = require('glue');

var manifest = {
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
    plugins: [
        {'./assets': {
            uglify: true
        }},
        {'./ui-user': [
            {
                select: ['web'],
                options: { }
            }
        ]},
        {'./ui-admin': [
            {
                select: ['admin'],
                routes: {
                    prefix: '/admin'
                },
                options: {
                    sessiontime: 500
                }
            }
        ]}
    ]
};

var options = {
    relativeTo: __dirname
};

Glue.compose(manifest, options, function (err, server) {

    if (err) {
        throw err;
    }
    server.start(function () {

        console.log('Hapi days!');
    });
});
```

The above is translated into the following equivalent Hapi API calls.

```javascript
var server = Hapi.Server({cache: [{engine: require('redis')}]});
server.connection({
    port: 8000,
    labels: ['web']
});
server.connection({
    port: 8001,
    labels: ['admin']
});
var pluginPath, pluginOptions, registerOptions;
pluginPath = Path.join(__dirname, './assets');
pluginOptions = {uglify: true};
registerOptions = {};
server.register({register: require(pluginPath), options: pluginOptions}, registerOptions, function (err) {

    if (err) {
        throw err;
    }
    pluginPath = Path.join(__dirname, './ui-user');
    pluginOptions = {};
    registerOptions = {select: ['web']};
    server.register({register: require(pluginPath), options: pluginOptions}, registerOptions, function (err) {

        if (err) {
            throw err;
        }
        pluginPath = Path.join(__dirname, './ui-admin');
        pluginOptions = {sessiontime: 500};
        registerOptions = {select: ['admin'], routes: {prefix: '/admin'}};
        server.register({register: require(pluginPath), options: pluginOptions}, registerOptions, function (err) {

            if (err) {
                throw err;
            }
            server.start(function () {

                console.log('Hapi days!');
            });
        });
    });
});
```
