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
    
    configure.call({
        route: function(routeName) {
            Object.defineProperty(routing, routeName, {
                get: function() {
                    var context = this;
					return new Handler(context, routeName);
                }
            });
        },
        resource: function(resourceName, nested) {
            var routes = [];
            
            if (typeof nested === 'function') {                
                nested.call({
                    route: function(routeName) {
                        routes.push(routeName);
                    }
                });
            }
                
            Object.defineProperty(routing, resourceName, {
                get: function() {
                    var context = this;
                    
                    var collection = function(id) {
                        var resource = new Handler(context, [resourceName, id]);
                        
                        routes.forEach(function(routeName) {
							resource[routeName] = new Handler(context, [resourceName, id, routeName]);
                        });
                        
                        return resource;
                    };
                    
                    return Handler.call(collection, context, resourceName);
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
    
    return Client;
}

module.exports.verbs = ['get', 'put', 'post', 'delete', 'head', 'options'];
