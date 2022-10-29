export const register = function (server, options) {

    server.expose('hello', (options.who ?? 'world') + ' (esm)');
};

export const name = 'helloworld';

export const multiple = false;
