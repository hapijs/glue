#glue

Server composer for hapi.js.

[![Build Status](https://secure.travis-ci.org/hapijs/glue.png)](http://travis-ci.org/hapijs/glue)

Lead Maintainer - [Chris Rempel](https://github.com/csrl)

## Interface

Glue exports a single function `compose` accepting a JSON `manifest` file specifying the Hapi server options, connections and plugins.  Glue primarily works in synergy with [Rejoice](https://github.com/hapijs/rejoice), but can be integrated directly into any Hapi application loader.

- `compose(manifest, [options], callback)`
  + `manifest` - an object having:
    * 'server' - an object containing the options passed to [`new Server([options])`](http://hapijs.com/api#new-serveroptions)
    * 'connections' - an array of connection options, passed individually in calls to [`server.connection([options])`](http://hapijs.com/api#serverconnectionoptions)
    * 'plugins' - an object or array of objects holding plugin entries to register with [`server.register(plugins, [options], callback)`](http://hapijs.com/api#serverregisterplugins-options-callback). Note that when using an object, the order of registration is not garanteed, while with the array it is. Still when you want absolutely garantee the order of plugin loading use the hapi built in way, [`server.dependecy(dependencies, [after])`](http://hapijs.com/api#serverdependencydependencies-after). Each key is the `name` of the plugin to load and register and the value is one of:
      + an object to use as the plugin options which get passed to the plugin's registration function when called.
      + an array of objects where each object will load a separate instance of the plugin. Multiple instances of a plugin is only possible if the plugin's `attributes.multiple` is `true`. Each object can have:
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
    * 'server' - a custom server instance to use for this manifest. You cannot specify any server options in the manifest, when using this option.
  + `callback` - the callback function with signature `function (err, server)` where:
    * `err` - the error response if a failure occurred, otherwise `null`.
    * `server` - the server object. Call `server.start()` to actually start the server.

## Usage

You create a manifest and then you can use the manifest for creating the new server:

```javascript
var Glue = require('glue');

var manifest = {
  server: {
    debug: {
      request: ['error']
    }
  },
  connections: [{
    port: 8080
  }],
  plugins: {
    './routes/index': {}
  }
};

var options = {
  relativeTo: __dirname
};

Glue.compose(manifest, options, function (err, server) {

    if (err) {
        throw err;
    }
    server.start(function () {

        console.log('woot');
    });
});
```
