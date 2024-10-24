'use strict';

const Path = require('path');

const { Engine: CatboxMemory } = require('@hapi/catbox-memory');
const Code = require('@hapi/code');
const Glue = require('..');
const Lab = require('@hapi/lab');
const Hoek = require('@hapi/hoek');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const expect = Code.expect;


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
                cache: '../node_modules/@hapi/catbox-memory'
            }
        };

        const server = await Glue.compose(manifest);
        expect(server.info).to.be.an.object();
        expect(server.info.port).to.equal(0);
    });

    it('composes a server with server.cache as an array', async () => {

        const manifest = {
            server: {
                cache: ['../node_modules/@hapi/catbox-memory']
            }
        };

        const server = await Glue.compose(manifest);
        expect(server.info).to.be.an.object();
        expect(server.info.port).to.equal(0);
    });

    it('composes a server with server.cache.provider as a string', async () => {

        const manifest = {
            server: {
                cache: {
                    provider: '../node_modules/@hapi/catbox-memory'
                }
            }
        };

        const server = await Glue.compose(manifest);
        expect(server.info).to.be.an.object();
        expect(server.info.port).to.equal(0);
    });

    it('composes a server with server.cache.provider as a string, with engine as default export', async () => {

        const manifest = {
            server: {
                cache: {
                    provider: '../test/catbox-memory-default'
                }
            }
        };

        const server = await Glue.compose(manifest);
        expect(server.info).to.be.an.object();
        expect(server.info.port).to.equal(0);
    });

    it('composes a server with server.cache.provider as a function', async () => {

        const manifest = {
            server: {
                cache: [{
                    provider: CatboxMemory
                }]
            }
        };

        const server = await Glue.compose(manifest);
        expect(server.info).to.be.an.object();
        expect(server.info.port).to.equal(0);
    });

    it('composes a server with server.cache.provider as an object', async () => {

        const manifest = {
            server: {
                cache: {
                    provider: {
                        constructor: CatboxMemory,
                        options: {
                            partition: 'x',
                            maxByteSize: 10000
                        }
                    },
                    name: 'memoryCache'
                }
            }
        };

        const server = await Glue.compose(manifest);
        expect(server.info).to.be.an.object();
        expect(server.info.port).to.equal(0);
    });

    it('composes a server with server.cache.provider as an object (string constructor)', async () => {

        const manifest = {
            server: {
                cache: {
                    provider: {
                        constructor: '../node_modules/@hapi/catbox-memory',
                        options: {
                            partition: 'x',
                            maxByteSize: 10000
                        }
                    },
                    name: 'memoryCache'
                }
            }
        };

        const server = await Glue.compose(manifest);
        expect(server.info).to.be.an.object();
        expect(server.info.port).to.equal(0);
    });

    it('composes a server with server.cache.provider resolved using options.relativeTo', async () => {

        const manifest = {
            server: {
                cache: '../../node_modules/@hapi/catbox-memory'
            }
        };

        const server = await Glue.compose(manifest, { relativeTo: __dirname + '/plugins' });
        expect(server.info).to.be.an.object();
        expect(server.info.port).to.equal(0);
    });

    it('composes a server with server.cache.provider resolved using options.relativeTo and absolute strategy path', async () => {

        const manifest = {
            server: {
                cache: Path.join(__dirname, '../node_modules/@hapi/catbox-memory')
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

        it('has an empty register object', async () => {

            const manifest = {
                register: {}
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

        it('has a registration with the plugin resolved using options.relativeTo, but with absolute path', async () => {

            const manifest = {
                register: {
                    plugins: [
                        {
                            plugin: Path.join(__dirname, 'plugins/helloworld.js')
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
                            plugin: '../test/plugins/second.js',
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

        it('has a registration with before and after options', async () => {

            const manifest = {
                register: {
                    plugins: [
                        {
                            plugin: '../test/plugins/after.js',
                            after: ['before']
                        },
                        {
                            plugin: require('./plugins/route'),
                            routes: { prefix: '/test/' }
                        },
                        {
                            plugin: '../test/plugins/before.js',
                            before: ['after']
                        }
                    ],
                    options: {
                        routes: { prefix: '/override/me/' }
                    }
                }
            };

            const server = await Glue.compose(manifest);
            expect(server.plugins.before.exists).to.equal(true);
            expect(server.plugins.after.exists).to.equal(true);
            const response = await server.inject('/test/plugin');
            expect(response.statusCode).to.equal(200);
        });
    });

    it('resolves ES modules from a path', async () => {

        const manifest = {
            register: {
                plugins: ['../test/plugins/helloworld.mjs']
            }
        };

        const server = await Glue.compose(manifest);
        expect(server.plugins.helloworld).to.exist();
        expect(server.plugins.helloworld.hello).to.equal('world (esm)');
    });

    it('composes a server with a preRegister handler', async () => {

        let count = 0;
        const manifest = {};
        const options = {
            preRegister: (server) => {

                expect(server.info).to.be.an.object();
                ++count;
            }
        };

        await Glue.compose(manifest, options);
        expect(count).to.equal(1);
    });

    it('composes a server with an async preRegister handler', async () => {

        let count = 0;
        const manifest = {
            register: {
                plugins: [
                    {
                        plugin: {
                            name: 'increment',
                            version: '1.0.0',
                            register: (server, options) => {

                                expect(server.info).to.be.an.object();
                                expect(count).to.equal(1);
                                count = count + options.increment;
                            }
                        },
                        options: {
                            increment: 2
                        }
                    }
                ]
            }
        };
        const options = {
            preRegister: (server) => {

                expect(server.info).to.be.an.object();
                expect(count).to.equal(0);
                return new Promise((resolve) => {

                    process.nextTick(() => {

                        ++count;
                        resolve();
                    });
                });
            }
        };

        await Glue.compose(manifest, options);
        expect(count).to.equal(3);
    });

    it('errors on failed preRegister handler', async () => {

        const manifest = {};
        const options = {
            preRegister: (server) => {

                throw new Error('preRegister failed');
            }
        };

        await expect(Glue.compose(manifest, options)).to.reject(Error, /preRegister failed/);
    });

    it('errors on failed async preRegister handler', async () => {

        const manifest = {};
        const options = {
            preRegister: (server) => {

                expect(server.info).to.be.an.object();
                return new Promise((resolve, reject) => {

                    process.nextTick(() => {

                        reject(new Error('preRegister failed'));
                    });
                });
            }
        };

        await expect(Glue.compose(manifest, options)).to.reject(Error, /preRegister failed/);
    });

    it('throws on bogus options.relativeTo path (server.cache)', async () => {

        const manifest = {
            server: {
                cache: './@hapi/catbox-memory'
            }
        };

        await expect(Glue.compose(manifest, { relativeTo: __dirname + '/badpath' })).to.reject(Error, /Glue could not resolve a module at/);
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

        await expect(Glue.compose(manifest, { relativeTo: __dirname + '/badpath' })).to.reject(Error, /Glue could not resolve a module at/);
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
