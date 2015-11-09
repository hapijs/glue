'use strict';
// Load modules

const Code = require('code');
const Glue = require('..');
const Lab = require('lab');


// Declare internals

const internals = {};


// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


describe('compose()', () => {

    it('composes server with an empty manifest', (done) => {

        const manifest = {};

        Glue.compose(manifest, (err, server) => {

            expect(err).to.not.exist();
            expect(server.connections).length(1);
            done();
        });
    });

    it('composes server with server.cache as a string', (done) => {

        const manifest = {
            server: {
                cache: '../node_modules/catbox-memory'
            }
        };

        Glue.compose(manifest, (err, server) => {

            expect(err).to.not.exist();
            done();
        });
    });

    it('composes server with server.cache as an array', (done) => {

        const manifest = {
            server: {
                cache: ['../node_modules/catbox-memory']
            }
        };

        Glue.compose(manifest, (err, server) => {

            expect(err).to.not.exist();
            done();
        });
    });

    it('composes server with server.cache.engine as a string', (done) => {

        const manifest = {
            server: {
                cache: {
                    engine: '../node_modules/catbox-memory'
                }
            }
        };

        Glue.compose(manifest, (err, server) => {

            expect(err).to.not.exist();
            done();
        });
    });

    it('composes server with server.cache.engine as a function', (done) => {

        const manifest = {
            server: {
                cache: [{
                    engine: require('catbox-memory')
                }]
            }
        };

        Glue.compose(manifest, (err, server) => {

            expect(err).to.not.exist();
            done();
        });
    });

    it('composes server with server.cache.engine resolved using options.relativeTo', (done) => {

        const manifest = {
            server: {
                cache: '../../node_modules/catbox-memory'
            }
        };

        Glue.compose(manifest, { relativeTo: __dirname + '/plugins' }, (err, server) => {

            expect(err).to.not.exist();
            done();
        });
    });

    it('composes server with connections array having multiple entries', (done) => {

        const manifest = {
            connections: [
                { labels: 'a' },
                { labels: 'b' }
            ]
        };

        Glue.compose(manifest, (err, server) => {

            expect(err).to.not.exist();
            expect(server.connections).length(2);
            done();
        });
    });

    it('composes server with plugins having a plugin with null options', (done) => {

        const manifest = {
            plugins: {
                '../test/plugins/helloworld.js': null
            }
        };

        Glue.compose(manifest, (err, server) => {

            expect(err).to.not.exist();
            expect(server.plugins.helloworld).to.exist();
            expect(server.plugins.helloworld.hello).to.equal('world');
            done();
        });
    });

    it('composes server with plugins having a plugin registered with options', (done) => {

        const manifest = {
            plugins: {
                '../test/plugins/helloworld.js': { who: 'earth' }
            }
        };

        Glue.compose(manifest, (err, server) => {

            expect(err).to.not.exist();
            expect(server.plugins.helloworld).to.exist();
            expect(server.plugins.helloworld.hello).to.equal('earth');
            done();
        });
    });

    it('composes server with plugins having a plugin with null options and null register options', (done) => {

        const manifest = {
            plugins: {
                '../test/plugins/helloworld.js': [{}]
            }
        };

        Glue.compose(manifest, (err, server) => {

            expect(err).to.not.exist();
            expect(server.plugins.helloworld).to.exist();
            expect(server.plugins.helloworld.hello).to.equal('world');
            done();
        });
    });

    it('composes server with plugins having a plugin registered with register options', (done) => {

        const manifest = {
            plugins: {
                '../test/plugins/route.js': [{
                    routes: { prefix: '/test/' }
                }]
            }
        };

        Glue.compose(manifest, (err, server) => {

            expect(err).to.not.exist();
            server.inject('/test/plugin', (response) => {

                expect(response.statusCode).to.equal(200);
                done();
            });
        });
    });

    it('composes server with plugins having a plugin loaded multiple times', (done) => {

        const manifest = {
            connections: [
                { labels: 'a' },
                { labels: 'b' }
            ],
            plugins: {
                '../test/plugins/route.js': [
                    {
                        select: 'a',
                        routes: { prefix: '/a/' }
                    },
                    {
                        select: 'b',
                        routes: { prefix: '/b/' }
                    }
                ]
            }
        };

        Glue.compose(manifest, (err, server) => {

            expect(err).to.not.exist();
            server.select('a').inject('/a/plugin', (responseA) => {

                expect(responseA.statusCode).to.equal(200);
                server.select('b').inject('/b/plugin', (responseB) => {

                    expect(responseB.statusCode).to.equal(200);
                    done();
                });
            });
        });
    });

    it('composes server with plugins resolved using options.relativeTo', (done) => {

        const manifest = {
            plugins: {
                './helloworld.js': null
            }
        };

        Glue.compose(manifest, { relativeTo: __dirname + '/plugins' }, (err, server) => {

            expect(err).to.not.exist();
            expect(server.plugins.helloworld.hello).to.equal('world');
            done();
        });
    });

    describe('Array of plugins', () => {

        it('composes server with plugins being an array of plugin objects', (done) => {

            const manifest = {
                plugins: [
                    { '../test/plugins/helloworld.js': null }
                ]
            };

            Glue.compose(manifest, (err, server) => {

                expect(err).to.not.exist();
                expect(server.plugins.helloworld).to.exist();
                expect(server.plugins.helloworld.hello).to.equal('world');
                done();
            });
        });

        it('Only accepts plugin objects with 1 key', { timeout: 30000 }, (done) => {

            const manifest = {
                plugins: [
                    { 'test': null, 'fail': null }
                ]
            };

            expect(() => {

                Glue.compose(manifest, () => {
                });
            }).to.throw('Invalid plugin config');
            done();
        });
    });

    it('composes server with preConnections handler', (done) => {

        const manifest = {};
        const options = {
            preConnections: function (server, callback) {

                callback();
            }
        };

        Glue.compose(manifest, options, (err, server) => {

            expect(err).to.not.exist();
            done();
        });
    });

    it('composes server with prePlugins handler', (done) => {

        const manifest = {};
        const options = {
            prePlugins: function (server, callback) {

                callback();
            }
        };

        Glue.compose(manifest, options, (err, server) => {

            expect(err).to.not.exist();
            done();
        });
    });

    it('errors on failed pre handler', (done) => {

        const manifest = {};
        const options = {
            prePlugins: function (server, callback) {

                callback({ error: 'failed' });
            }
        };

        Glue.compose(manifest, options, (err, server) => {

            expect(err).to.exist();
            done();
        });
    });

    it('throws on bogus options.realativeTo path (server.cache)', (done) => {

        const manifest = {
            server: {
                cache: './catbox-memory'
            }
        };

        expect(() => {

            Glue.compose(manifest, { relativeTo: __dirname + '/badpath' }, () => { });
        }).to.throw(/Cannot find module/);
        done();
    });

    it('throws on bogus options.realativeTo path (plugins)', (done) => {

        const manifest = {
            plugins: {
                './helloworld.js': null
            }
        };

        expect(() => {

            Glue.compose(manifest, { relativeTo: __dirname + '/badpath' }, () => { });
        }).to.throw(/Cannot find module/);
        done();
    });

    it('throws on options not an object', (done) => {

        const manifest = {};

        expect(() => {

            Glue.compose(manifest, 'hello', () => { });
        }).to.throw(/Invalid options/);
        done();
    });

    it('throws on callback not a function', (done) => {

        const manifest = {};

        expect(() => {

            Glue.compose(manifest, 'hello');
        }).to.throw(/Invalid callback/);
        done();
    });

    it('throws on invalid manifest (not an object)', (done) => {

        const manifest = 'hello';

        expect(() => {

            Glue.compose(manifest, () => { });
        }).to.throw(/Invalid manifest/);
        done();
    });

    it('throws on invalid manifest (server not an object)', (done) => {

        const manifest = {
            server: 'hello'
        };

        expect(() => {

            Glue.compose(manifest, () => { });
        }).to.throw(/Invalid manifest/);
        done();
    });

    it('throws on invalid manifest (connections not an array)', (done) => {

        const manifest = {
            connections: 'hello'
        };

        expect(() => {

            Glue.compose(manifest, () => { });
        }).to.throw(/Invalid manifest/);
        done();
    });

    it('throws on invalid manifest (connections must have at least one entry)', (done) => {

        const manifest = {
            connections: []
        };

        expect(() => {

            Glue.compose(manifest, () => { });
        }).to.throw(/Invalid manifest/);
        done();
    });

    it('throws on invalid manifest (plugins not an object)', (done) => {

        const manifest = {
            plugins: 'hello'
        };

        expect(() => {

            Glue.compose(manifest, () => { });
        }).to.throw(/Invalid manifest/);
        done();
    });

    it('throws on invalid plugin configuration (empty instances)', (done) => {

        const manifest = {
            plugins: {
                '../test/plugins/helloworld.js': []
            }
        };

        expect(() => {

            Glue.compose(manifest, () => { });
        }).to.throw(/Invalid plugin configuration/);
        done();
    });

    it('throws on invalid plugin configuration (bogus instance)', (done) => {

        const manifest = {
            plugins: {
                '../test/plugins/helloworld.js': ['bogus']
            }
        };

        expect(() => {

            Glue.compose(manifest, () => { });
        }).to.throw(/Invalid plugin configuration/);
        done();
    });
});
