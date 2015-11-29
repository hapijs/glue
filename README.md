## glue

[![Build Status](https://travis-ci.org/hapijs/glue.svg)](https://travis-ci.org/hapijs/glue)

Lead Maintainer - [Chris Rempel](https://github.com/csrl)

### A server composer for hapi.js.

Glue provides configuration based composition of Hapi's Server object. Specifically it wraps

 * `server = new Hapi.Server(Options)`
 * one or more `server.connection(Options)`
 * zero or more `server.register(Plugin, Options)`

calling each based on the configuration generated from the Glue manifest.

### Interface

Glue's [API](API.md) is a single function `compose` accepting a JSON `manifest` file specifying the hapi server options, connections, and registrations.

### Hapi version dependency

Glue can support different versions of Hapi. Adding support for a new version of Hapi is considered a `minor` change. Removing support for a version of Hapi is considered a `major` change.

By default NPM will resolve Glue's dependency on Hapi using the most recent supported version of Hapi. To force a specific supported Hapi version for your project, include Hapi in your package dependencies along side of Glue.

Glue currently supports Hapi **11**.
