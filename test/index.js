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

    it('composes a server with an empty manifest', (done) => {

        const manifest = {};

        Glue.compose(manifest, (err, server) => {

            expect(err).to.not.exist();
            expect(server.connections).length(1);
            done();
        });
    });

    it('returns a promise if no options and no callback is provided', (done) => {

        const manifest = {};

        Glue.compose(manifest).then((server) => {

            expect(server.connections).length(1);
            done();
        });
    });

    it('returns a promise if no callback is provided', (done) => {

        const manifest = {};
        const options = {};

        Glue.compose(manifest, options).then((server) => {

            expect(server.connections).length(1);
            done();
        });
    });

    it('rejects a promise if an error is thrown', (done) => {

        const manifest = {
            registrations: [
                {
                    plugin: './invalid-plugin'
                }
            ]
        };

        Glue.compose(manifest).catch((err) => {

            expect(err).to.exist();
            expect(err.code).to.equal('MODULE_NOT_FOUND');
            done();
        });
    });

    it('rejects a promise if an error is returned', (done) => {

        const manifest = {};
        const options = {
            preRegister: function (server, callback) {

                callback({ error: 'failed' });
            }
        };

        Glue.compose(manifest, options).then(null, (err) => {

            expect(err).to.exist();
            done();
        });
    });

    it('composes a server with server.cache as a string', (done) => {

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

    it('composes a server with server.cache as an array', (done) => {

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

    it('composes a server with server.cache.engine as a string', (done) => {

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

    it('composes a server with server.cache.engine as a function', (done) => {

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

    it('composes a server with server.cache.engine resolved using options.relativeTo', (done) => {

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

    describe('composes a server\'s connections', () => {

        it('has no entries', (done) => {

            const manifest = {
                connections: []
            };

            Glue.compose(manifest, (err, server) => {

                expect(err).to.not.exist();
                expect(server.connections).length(1);
                done();
            });
        });

        it('has a single entry', (done) => {

            const manifest = {
                connections: [
                    { labels: 'a' }
                ]
            };

            Glue.compose(manifest, (err, server) => {

                expect(err).to.not.exist();
                expect(server.connections).length(1);
                done();
            });
        });

        it('has multiple entries', (done) => {

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
    });

    describe('composes a server\'s registrations', () => {

        it('has no registrations', (done) => {

            const manifest = {
                registrations: []
            };

            Glue.compose(manifest, (err, server) => {

                expect(err).to.not.exist();
                expect(server.plugins).length(0);
                done();
            });
        });

        it('has a registration with no configuration', (done) => {

            const manifest = {
                registrations: [
                    {
                        plugin: '../test/plugins/helloworld.js'
                    }
                ]
            };

            Glue.compose(manifest, (err, server) => {

                expect(err).to.not.exist();
                expect(server.plugins.helloworld).to.exist();
                expect(server.plugins.helloworld.hello).to.equal('world');
                done();
            });
        });

        it('passes through unknown plugin object fields', (done) => {

            const manifest = {
                registrations: [
                    {
                        plugin: {
                            register: '../test/plugins/helloworld.js'
                        }
                    }
                ]
            };

            Glue.compose(manifest, (err, server) => {

                expect(err).to.not.exist();
                expect(server.plugins.helloworld).to.exist();
                expect(server.plugins.helloworld.hello).to.equal('world');
                done();
            });
        });

        it('has a registration with no plugin options and no register options', (done) => {

            const manifest = {
                registrations: [
                    {
                        plugin: {
                            register: '../test/plugins/helloworld.js'
                        }
                    }
                ]
            };

            Glue.compose(manifest, (err, server) => {

                expect(err).to.not.exist();
                expect(server.plugins.helloworld).to.exist();
                expect(server.plugins.helloworld.hello).to.equal('world');
                done();
            });
        });

        it('has a registration with plugin options and no register options', (done) => {

            const manifest = {
                registrations: [
                    {
                        plugin: {
                            register: '../test/plugins/helloworld.js',
                            options: { who: 'earth' }
                        }
                    }
                ]
            };

            Glue.compose(manifest, (err, server) => {

                expect(err).to.not.exist();
                expect(server.plugins.helloworld).to.exist();
                expect(server.plugins.helloworld.hello).to.equal('earth');
                done();
            });
        });

        it('has a registration with register options and no plugin options', (done) => {

            const manifest = {
                registrations: [
                    {
                        plugin: '../test/plugins/route.js',
                        options: {
                            routes: { prefix: '/test/' }
                        }
                    }
                ]
            };

            Glue.compose(manifest, (err, server) => {

                expect(err).to.not.exist();
                server.inject('/test/plugin', (response) => {

                    expect(response.statusCode).to.equal(200);
                    done();
                });
            });
        });

        it('has registrations having the same plugin loaded multiple times', (done) => {

            const manifest = {
                connections: [
                    { labels: 'a' },
                    { labels: 'b' }
                ],
                registrations: [
                    {
                        plugin: '../test/plugins/route.js',
                        options: {
                            select: 'a',
                            routes: { prefix: '/a/' }
                        }
                    },
                    {
                        plugin: '../test/plugins/route.js',
                        options: {
                            select: 'b',
                            routes: { prefix: '/b/' }
                        }
                    }
                ]
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

        it('has a registration with the plugin resolved using options.relativeTo', (done) => {

            const manifest = {
                registrations: [
                    {
                        plugin: './helloworld.js'
                    }
                ]
            };

            Glue.compose(manifest, { relativeTo: __dirname + '/plugins' }, (err, server) => {

                expect(err).to.not.exist();
                expect(server.plugins.helloworld.hello).to.equal('world');
                done();
            });
        });
    });

    it('composes a server with a preConnections handler', (done) => {

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

    it('composes a server with a preRegister handler', (done) => {

        const manifest = {};
        const options = {
            preRegister: function (server, callback) {

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
            preRegister: function (server, callback) {

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
            registrations: [
                {
                    plugin: './helloworld.js'
                }
            ]
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

    it('throws on invalid manifest (registrations not an array)', (done) => {

        const manifest = {
            registrations: 'hello'
        };

        expect(() => {

            Glue.compose(manifest, () => { });
        }).to.throw(/Invalid manifest/);
        done();
    });
});
