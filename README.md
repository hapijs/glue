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
    * 'plugins' - an object holding plugin entries to register with [`server.register(plugins, [options], callback)`](http://hapijs.com/api#serverregisterplugins-options-callback).  Each key is the `name` of the plugin to load and register and the value is the plugin options.
  + `options` - an object having
    * 'relativeTo' - (optional) a file-system path string that is used to resolve loading modules with `require`.  Used in `server.cache` and `plugins[name]`
    * 'preConnections' - (optional) a callback function that is called prior to adding connections to the server. The function signature is `function (server)` where:
      + `server` - is the server object returned from `new Server(options)`.
    * 'prePlugins' - (optional) a callback function that is called prior to registering plugins with the server. The function signature is `function (server)` where:
      + `server` - is the server object with all connections selected.
  + `callback` - the callback function with signature `function (err, server)` where:
    * `err` - the error response if a failure occurred, otherwise `null`.
    * `server` - the server object. Call `server.start()` to actually start the server.
