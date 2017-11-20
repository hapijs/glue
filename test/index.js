'use strict';
// Load modules

const Glue = require('..');
const Lab = require('lab');
const Hoek = require('hoek');


// Declare internals

const internals = {};


// Test shortcuts

const { describe, expect, it } = exports.lab = Lab.script();

describe('compose()', () => {

    it('composes a server with an empty manifest', async () => {

        const manifest = {};
        const server = await Glue.compose(manifest);
        expect(server.info).to.be.an.object();
        expect(server.info.port).to.equal(0);
    });

    it('throws an error', async () => {

        const manifest = {
            register: {
                plugins: ['invalidplugin']
            }
        };

        await expect(Glue.compose(manifest)).to.reject(Error, /Cannot find module/);
    });

    it('composes a server with server.cache as a string', async () => {

        const manifest = {
            server: {
                cache: '../node_modules/catbox-memory'
            }
        };

        const server = await Glue.compose(manifest);
        expect(server.info).to.be.an.object();
        expect(server.info.port).to.equal(0);
    });

    it('composes a server with server.cache as an array', async () => {

        const manifest = {
            server: {
                cache: ['../node_modules/catbox-memory']
            }
        };

        const server = await Glue.compose(manifest);
        expect(server.info).to.be.an.object();
        expect(server.info.port).to.equal(0);
    });

    it('composes a server with server.cache.engine as a string', async () => {

        const manifest = {
            server: {
                cache: {
                    engine: '../node_modules/catbox-memory'
                }
            }
        };

        const server = await Glue.compose(manifest);
        expect(server.info).to.be.an.object();
        expect(server.info.port).to.equal(0);
    });

    it('composes a server with server.cache.engine as a function', async () => {

        const manifest = {
            server: {
                cache: [{
                    engine: require('catbox-memory')
                }]
            }
        };

        const server = await Glue.compose(manifest);
        expect(server.info).to.be.an.object();
        expect(server.info.port).to.equal(0);
    });

    it('composes a server with server.cache.engine resolved using options.relativeTo', async () => {

        const manifest = {
            server: {
                cache: '../../node_modules/catbox-memory'
            }
        };

        const server = await Glue.compose(manifest, { relativeTo: __dirname + '/plugins' });
        expect(server.info).to.be.an.object();
        expect(server.info.port).to.equal(0);
    });

    it('composes a server without modifying the manifest', async () => {

        const manifest = {
            register: {
                plugins: [
                    {
                        plugin: '../test/plugins/helloworld.js'
                    }
                ]
            }
        };
        const clone = Hoek.clone(manifest);

        const server = await Glue.compose(manifest);
        expect(server.plugins.helloworld).to.exist();
        expect(Hoek.deepEqual(manifest, clone)).to.equal(true);
    });

    describe('composes a server\'s registrations', () => {

        it('has no registrations', async () => {

            const manifest = {
                register: {
                    plugins: []
                }
            };

            const server = await Glue.compose(manifest);
            expect(server.plugins).length(0);
        });

        it('has a registration with a plugin path only', async () => {

            const manifest = {
                register: {
                    plugins: ['../test/plugins/helloworld.js']
                }
            };

            const server = await Glue.compose(manifest);
            expect(server.plugins.helloworld).to.exist();
            expect(server.plugins.helloworld.hello).to.equal('world');
        });

        it('has a registration with plugin object instead of path to be required', async () => {

            const manifest = {
                register: {
                    plugins: [{
                        plugin: require('./plugins/helloworld')
                    }]
                }
            };

            const server = await Glue.compose(manifest);
            expect(server.plugins.helloworld).to.exist();
            expect(server.plugins.helloworld.hello).to.equal('world');
        });

        it('has a registration with no configuration', async () => {

            const manifest = {
                register: {
                    plugins: [
                        {
                            plugin: '../test/plugins/helloworld.js'
                        }
                    ]
                }
            };

            const server = await Glue.compose(manifest);
            expect(server.plugins.helloworld).to.exist();
            expect(server.plugins.helloworld.hello).to.equal('world');
        });

        it('passes through original plugin options', async () => {

            const manifest = {
                register: {
                    plugins: [
                        {
                            plugin: '../test/plugins/helloworld.js',
                            options: {
                                who: { i: 'am not a clone' }
                            }
                        }
                    ]
                }
            };

            const server = await Glue.compose(manifest);
            expect(server.plugins.helloworld).to.exist();
            expect(server.plugins.helloworld.hello === manifest.register.plugins[0].options.who).to.be.equal(true);
        });

        it('has a registration with no plugin options and no register options', async () => {

            const manifest = {
                register: {
                    plugins: [
                        {
                            plugin: '../test/plugins/helloworld.js'
                        }
                    ]
                }
            };

            const server = await Glue.compose(manifest);
            expect(server.plugins.helloworld).to.exist();
            expect(server.plugins.helloworld.hello).to.equal('world');
        });

        it('has a registration with plugin options and no register options', async () => {

            const manifest = {
                register: {
                    plugins: [
                        {
                            plugin: '../test/plugins/helloworld.js',
                            options: { who: 'earth' }
                        }
                    ]
                }
            };

            const server = await Glue.compose(manifest);
            expect(server.plugins.helloworld).to.exist();
            expect(server.plugins.helloworld.hello).to.equal('earth');
        });

        it('has a registration with register options and no plugin options', async () => {

            const manifest = {
                register: {
                    plugins: [
                        {
                            plugin: '../test/plugins/route.js'
                        }
                    ],
                    options: {
                        routes: { prefix: '/test/' }
                    }
                }
            };

            const server = await Glue.compose(manifest);
            const response = await server.inject('/test/plugin');
            expect(response.statusCode).to.equal(200);
        });

        it('has a registration with register options in the plugin', async () => {

            const manifest = {
                register: {
                    plugins: [
                        {
                            plugin: '../test/plugins/route.js',
                            routes: { prefix: '/test/' }
                        }
                    ]
                }
            };

            const server = await Glue.compose(manifest);
            const response = await server.inject('/test/plugin');
            expect(response.statusCode).to.equal(200);
        });

        it('has a registration with the plugin resolved using options.relativeTo', async () => {

            const manifest = {
                register: {
                    plugins: [
                        {
                            plugin: './helloworld.js'
                        }
                    ]
                }
            };

            const server = await Glue.compose(manifest, { relativeTo: __dirname + '/plugins' });
            expect(server.plugins.helloworld.hello).to.equal('world');
        });

        it('has a registration with different plugin syntax, some plugin options, main registration options, and plugin-level registration options', async () => {

            const manifest = {
                register: {
                    plugins: [
                        '../test/plugins/helloworld.js',
                        {
                            plugin : '../test/plugins/second.js',
                            options: {
                                value: 'second'
                            }
                        },
                        {
                            plugin: require('./plugins/route'),
                            routes: { prefix: '/test/' }
                        }
                    ],
                    options: {
                        routes: { prefix: '/override/me/' }
                    }
                }
            };

            const server = await Glue.compose(manifest);
            expect(server.plugins.helloworld.hello).to.equal('world');
            const response = await server.inject('/test/plugin');
            expect(response.statusCode).to.equal(200);
            const secondResponse = await server.inject('/override/me/second');
            expect(secondResponse.statusCode).to.equal(200);
            expect(secondResponse.payload).to.equal('second');
        });
    });

    it('composes a server with a preRegister handler', async () => {

        let count = 0;
        const manifest = {};
        const options = {
            preRegister: function (server) {

                ++count;
            }
        };

        await Glue.compose(manifest, options);
        expect(count).to.equal(1);
    });

    it('errors on failed pre handler', async () => {

        const manifest = {};
        const options = {
            preRegister: function (server, callback) {

                callback({ error: 'failed' });
            }
        };

        await expect(Glue.compose(manifest, options)).to.reject();
    });

    it('throws on bogus options.relativeTo path (server.cache)', async () => {

        const manifest = {
            server: {
                cache: './catbox-memory'
            }
        };

        await expect(Glue.compose(manifest, { relativeTo: __dirname + '/badpath' })).to.reject(Error, /Cannot find module/);
    });

    it('throws on bogus options.relativeTo path (plugins)', async () => {

        const manifest = {
            register: {
                plugins: [
                    {
                        plugin: './helloworld.js'
                    }
                ]
            }
        };

        await expect(Glue.compose(manifest, { relativeTo: __dirname + '/badpath' })).to.reject(Error, /Cannot find module/);
    });

    it('throws on options not an object', async () => {

        const manifest = {};

        await expect(Glue.compose(manifest, 'hello')).to.reject(Error, /Invalid options/);
    });

    it('throws on invalid options (preConnections present)', async () => {

        const options = {
            preConnections: false
        };

        await expect(Glue.compose({}, options)).to.reject(Error, /Invalid options/);
    });

    it('throws on invalid manifest (not an object)', async () => {

        const manifest = 'hello';

        await expect(Glue.compose(manifest)).to.reject(Error, /Invalid manifest/);
    });

    it('throws on invalid manifest (server not an object)', async () => {

        const manifest = {
            server: 'hello'
        };

        await expect(Glue.compose(manifest)).to.reject(Error, /Invalid manifest/);
    });

    it('throws on invalid manifest (connections present)', async () => {

        const manifest = {
            connections: [
                {}
            ]
        };

        await expect(Glue.compose(manifest)).to.reject(Error, /Invalid manifest/);
    });

    it('throws on invalid manifest (register not an object)', async () => {

        const manifest = {
            register: 'hello'
        };

        await expect(Glue.compose(manifest)).to.reject(Error, /Invalid manifest/);
    });
});
