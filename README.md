## glue

[![Build Status](https://travis-ci.org/hapijs/glue.svg)](https://travis-ci.org/hapijs/glue)

Lead Maintainer - [Chris Rempel](https://github.com/csrl)

### A server composer for hapi.js.

Glue provides configuration based composition of hapi's Server object. Specifically it wraps

 * `server = new Hapi.Server(Options)`
 * one or more `server.connection(Options)`
 * zero or more `server.register(Plugin, Options)`

calling each based on the configuration generated from the Glue manifest.

### Interface

Glue's [API](API.md) is a single function `compose` accepting a JSON `manifest` file specifying the hapi server options, connections, and registrations.

### hapi version dependency

Glue can support different versions of hapi. Adding support for a new version of hapi is considered a `minor` change. Removing support for a version of hapi is considered a `major` change.

By default NPM will resolve Glue's dependency on hapi using the most recent supported version of hapi. To force a specific supported hapi version for your project, include hapi in your package dependencies along side of Glue.

Glue currently supports hapi **11**, **12**, **13**, **14**, **15**, and **16**.
