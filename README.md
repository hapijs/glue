#glue

Server composer for hapi.js.

[![Build Status](https://secure.travis-ci.org/hapijs/glue.png)](http://travis-ci.org/hapijs/glue)

Lead Maintainer - [Chris Rempel](https://github.com/csrl)

## Overview

Glue is a hapijs application composer which utilizes a JSON object called `manifest` to compose 
an application. The manifest defines server options, connections, and plugin 
registrations.  All major configurations are defined in this object.  

 
## Interface

Glue exports a single function `compose` accepting the JSON `manifest` file specifying the Hapi server options, connections and plugins.  

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

## Plugin Load Order and Dependencies

When using glue to bootstrap an application there is a small gotcha regarding plugin load order and dependencies.  
V8 will not guarantee JSON object elements are loaded in the sequential order defined in the object. 
Hence, if a plugin relies on a dependecy previously declared in the `manifest`, the dependency may not be loaded first causing errors. 
If you set the attributes.dependencies key it just specifies that dependencies must eventually exist, but does not require  
they exist before your plugin. In short, the below does not guarantee dependencies will be loaded first. 

```
register.attributes = {
    name: 'Auth',
    dependencies:'haps-auth-basic' 
};
```

### Solutions

+ Quick Solution  
  * Make the value of the manifest.plugins key an array.  
    If the key is an array the plugins will be loaded in the sequence of the array.  
  *  Pros: 
    * Quickly configure your apps plugin load order.
    * Do not have to declare dependencies inside other plugins. 
  *  Cons: 
    * If order of plugins is changed in the array, it could break the application.
    * Must do accounting to correctly order plugins defined in the array. 

+ Bullet Proof Solution  
  * Make manifest.plugins key a JSON object listing plugins in any order to be registered. Plus, inside 
    plugins with dependencies use `server.dependency(dependencies, [after])` logic to declare dependencies and ensure 
    depencies are loaded first.
  * Documentation: [`server.dependecy(dependencies, [after])`](http://hapijs.com/api#serverdependencydependencies-after)
  * Example solution: [@FennNaten Example](https://github.com/FennNaten/aqua/blob/sample/setting-deps-via-server-register/server/auth.js)
  * Pros: 
    * Solution is airtight.  
    * This is the preferred hapijs solution.
    * Just declare the plugin in the manifest.plugins JSON object. 
    * Then in plugins that have dependencies, use server.dependency(dependencies, after) logic 
      to ensure dependencies are loaded first. 
    * Easy to read: Every plugin with dependecies has them clearly defined at the 
      top of the plugin. 
  * Cons:
    * Plugins with dependencies code is a little more verbose.  
    * Developer has to write a little more code.
    

## Example of a Plugin  Declarating Dependencies

Below is bullet proof solution from  @FennNaten 's example:
[@FennNaten 's Fork of aqua](https://github.com/FennNaten/aqua/blob/sample/setting-deps-via-server-register/server/auth.js)

```
internals = {};

exports.register = function (server, options, next) {

    // the registration logic in internals.after will be executed on server start, 
    // and only after dependencies are fully registered. 
    server.dependency(['hapi-auth-cookie', 'hapi-mongo-models'], internals.after);

    next();
};

// all the registration logic depends on other plugins (uses schemes and plugins-specific space), 
// so we extract it so that we can set it up to be fired only after dependency resolution
internals.after = function(server, next){

    var Session = server.plugins['hapi-mongo-models'].Session;
    var User = server.plugins['hapi-mongo-models'].User;

    // Plugin code here.

    next();
};

```

## Other notes
Glue primarily works in synergy with [Rejoice](https://github.com/hapijs/rejoice), but can be integrated directly into any Hapi application loader.

## Sources 
@FennNaten wrote explanations about Glue and plugin dependency logic.<br/> 
See his explanations:<br/>
[Testing Glue Dependency Logic](https://github.com/hapijs/university/pull/137)<br/>
[Mark Strategies as Dependant](https://github.com/jedireza/aqua/issues/36)<br/>
@nlf gitter conversation<br/>
