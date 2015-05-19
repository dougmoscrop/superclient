# superclient
using it is pretty easy:
### configure routing

```javascript
    var superclient = require('superclient');
    
    // create a constructor by configuring the routing
    var Client = superclient(function() {
        // adds a basic route '/test'
        this.route('test');
        
        // adds a resource route '/images' and '/images/:id'
        this.resource('images');
        
        // add another resource route '/users' and '/users/:id'
        this.resource('users', function() {
            // this adds a sub-route `/users/:id/profile`
            this.route('profile');
        });
    });
```

`Client` is a constructor that takes an optional prefix and a function which is called for every request. This is how you can delegate to supertest or superagent.

```javascript
    // prefix all URLs with 'api'
    var api = new Client('api', function performRequest(verb, url) {
        return superagent[verb](url); // superagent(express)[verb](url)
    });
```

Now this `api` object is a fluent interface to the routing that was configured previously:

```javascript
    // remember we specified the prefix 'api'
    api.foo // undefined
    api.test // a 'handler' which has HTTP verbs on it
    api.test.get() // superagent.get(/api/test)
    
    // the call goes through to super[agent|test] like normal
    api.users.post().send({ name: 'new user' }); // superagent.post(/api/users)
    
    api.users(123).put() // superagent.put(/users/123)
    api.users(123).profile.get() // superagent.get(/users/123/profile)
```

The configuration step can be done separately and even exported as it's own package - since the request handling is provided late, you can use it as a real API client as well as for testing said API itself. Also since the prefix is determined outside of the routing structure this can come in handy (service location, etc.)

## things to add:
it would be interesting to support arbitrarily nested routing, including subresources i.e. `/foo/:foo_id/someRoute/bar/:bar_id`

it might also be ineresting to take a URL as a 'step' to build from, so if you get a Created response with a Location header, something like:

```javascript
    api.users.post({ /* ... */ }).then(function() {
        var location = '/users/9000'; // assume that's the header
        var user = api.users(/* undefined id */).url(location) // 'set' the url up to this point
        user.profile.get() // GET /users/9000/profile
    })
```