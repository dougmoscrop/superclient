var url = require('url'),
    urlJoin = require('url-join');

function Handler(context, path) {
  var root = url.resolve('/', context.root);
  var paths = [].concat(path).map(encodeURIComponent);

  paths.unshift(root);

  var completeUrl = urlJoin.apply(urlJoin, paths);
  var _this = this;

  module.exports.verbs.forEach(function(verb) {
    _this[verb] = context.request.bind(context.request, verb, completeUrl);
  });

  return this;
}

module.exports = function Configure(configure) {
  var routing = {};

  configure && configure.call({
    route: function(routeName, routePath) {
      if (typeof routePath !== 'string') {
        routePath = routeName;
      }

      Object.defineProperty(routing, routeName, {
          get: function() {
            var context = this;
            return new Handler(context, routePath);
          }
      });
    },
    resource: function(resourceName) {
      var routes = [];
      var resourcePath = resourceName;

      if (typeof arguments[1] === 'string') {
        resourcePath = arguments[1];
      }

      var nested = arguments[arguments.length - 1];

      if (typeof nested === 'function') {
        nested.call({
          route: function(routeName, routePath) {
            if (typeof routePath !== 'string') {
              routePath = routeName;
            }

            routes.push({
              name: routeName,
              path: routePath
            });
          }
        });
      }

      Object.defineProperty(routing, resourceName, {
        get: function() {
          var context = this;

          var collection = function() {
            var basePath = [resourcePath].concat([].slice.call(arguments));
            var resource = new Handler(context, basePath);

            routes.forEach(function(route) {
              resource[route.name] = new Handler(context, basePath.concat(route.path));
            });

            return resource;
          };

          return Handler.call(collection, context, resourcePath);
        }
      });
    }
  });

  var Client = function(root, request) {
    if (arguments.length === 1) {
      request = arguments[0];
      root = '';
    }

    if (typeof request === 'function') {
      this.request = request;
      this.root = root;

      return this;
    }

    throw new Error('request must be a function');
  };

  Client.prototype = routing;

  module.exports.verbs.forEach(function(verb) {
    routing[verb] = function() {
      return this.request(verb, this.root);
    };
  });

  return Client;
}

module.exports.verbs = ['get', 'put', 'post', 'delete', 'head', 'options', 'patch'];
