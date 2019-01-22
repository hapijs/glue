## glue

[![Build Status](https://travis-ci.org/hapijs/glue.svg)](https://travis-ci.org/hapijs/glue)

Lead Maintainer - [Chris Rempel](https://github.com/csrl)

### A server composer for hapi.js.

Glue provides configuration based composition of hapi's Server object. Specifically it wraps

 * `server = Hapi.server(Options)`
 * `server.register(Plugins, Options)`

calling each based on the configuration generated from the glue manifest.

### Interface

Glue's [API](API.md) is a single function `compose` accepting a JSON `manifest` specifying the hapi server options and registrations.

### hapi version dependency

Glue can support different versions of hapi. Adding support for a new version of hapi is considered a `minor` change. Removing support for a version of hapi is considered a `major` change.

By default NPM will resolve glue's dependency on hapi using the most recent supported version of hapi. To force a specific supported hapi version for your project, include hapi in your package dependencies along side of glue.

Glue version 6 currently supports hapi **18**.
[glue@v5](https://github.com/hapijs/glue/tree/v5) supports hapi **17**.
[glue@v4](https://github.com/hapijs/glue/tree/v4) supports hapi **11**, **12**, **13**, **14**, **15**, or **16**.
