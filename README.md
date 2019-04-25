<a href="http://hapijs.com"><img src="https://raw.githubusercontent.com/hapijs/assets/master/images/family.png" width="180px" align="right" /></a>

# glue

[![Build Status](https://travis-ci.org/hapijs/glue.svg)](https://travis-ci.org/hapijs/glue)

### A server composer for hapi.js.

Glue provides configuration based composition of hapi's Server object. Specifically it wraps

 * `server = Hapi.server(Options)`
 * `server.register(Plugins, Options)`

calling each based on the configuration generated from the glue manifest.

### hapi version dependency

Version 6 supports hapi **v18**   
Version 5 supports hapi **v17**

By default npm will resolve glue's dependency on hapi using the most recent supported version of hapi. To force a specific supported hapi version for your project, include hapi in your package dependencies along side of glue.

### Interface

glue's [API](API.md) is a single function `compose` accepting a JSON `manifest` specifying the hapi server options and registrations.
