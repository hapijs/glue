exports.register = function (server, options, next) {
    server.expose(server.realm.modifiers.route);
    next();
};

exports.register.attributes = {
    name: 'route',
    multiple: true
};
