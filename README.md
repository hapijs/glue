<a href="http://hapijs.com"><img src="https://github.com/hapijs/assets/blob/master/images/family.svg" width="180px" align="right" /></a>

# glue

[![Build Status](https://travis-ci.org/hapijs/glue.svg)](https://travis-ci.org/hapijs/glue)

**glue** version 5 only supports hapi **17**.

### A server composer for hapi.js.

Glue provides configuration based composition of hapi's Server object. Specifically it wraps

 * `server = Hapi.server(Options)`
 * `server.register(Plugins, Options)`

calling each based on the configuration generated from the Glue manifest.

### Interface

Glue's [API](API.md) is a single function `compose` accepting a JSON `manifest` specifying the hapi server options and registrations.
