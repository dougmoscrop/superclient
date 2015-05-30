var sinon = require('sinon'),
	should = require('should'),
    superclient = require('./index');

describe('superclient', function () {

    var configure,
        Client;

    beforeEach(function () {
        configure = sinon.spy(function () {
            this.should.have.properties('resource', 'route');

            this.route('foo', function() {
              this.should.not.have.properties('resource', 'route');
            });
          
            this.resource('bars', function () {
                this.should.have.property('route');
                this.should.not.have.property('resource');
                
                this.route('baz', function() {
                    this.should.not.have.property('resource', 'route');
                });
            });
			
			this.route('someRoute', 'some-route');
			this.resource('someResource', 'some-resource', function() {
				this.route('someRouteName', 'some-route-name');
			});
        });
        
        Client = superclient(configure);
    });

    it('produces a constructor', function () {
        Client.should.have.type('function');
    });
    
    describe('when constructed', function() {
        
        var request,
            client,
			http;
        
        beforeEach(function() {
			http = {
            	get: sinon.spy()
        	};
			
            request = sinon.spy(function(verb, url) {
                return http[verb](url);
            });
            
            client = new Client(request);
        });
        
        it('calls configure once', function() {
            var client2 = new Client(request);
            
            configure.should.have.property('calledOnce', true);
        });
        
        it('does not try call request', function () {
            request.should.have.property('called', false);
        });

        it('has the correct routing', function () {
            client.should.have.property('foo');
            client.should.not.have.property('baz');

            client.foo.should.have.properties('get', 'put', 'post', 'delete', 'head');

            client.should.have.property('bars');
            client.bars.should.have.properties('get', 'put', 'post', 'delete', 'head');
            client.bars.should.have.type('function');
            client.bars.should.not.have.property('baz');

            var bar1 = client.bars(1);

            bar1.should.have.properties('get', 'put', 'post', 'delete', 'head');
            bar1.should.have.property('baz');
            bar1.baz.should.have.properties('get', 'put', 'post', 'delete', 'head');
        });

        it('supports multiple clients with different request-handlers', function() {
            var request2 = sinon.spy(function() {
                return http;
            });

            var client2 = new Client(request2);

            client.foo.get();
            client2.foo.get();
            client2.foo.put();

            request.should.have.property('calledOnce', true);
            request2.should.have.property('calledTwice', true);
        });
        
		describe('has correct URL for', function() {
			it('route', function() {
				client.foo.get();            
				sinon.assert.calledWith(http.get, '/foo')
			});
			
			it('collection', function() {
				client.bars.get();
				sinon.assert.calledWith(http.get, '/bars')
			});
			
			it('resource', function() {
				client.bars(123).get();
				sinon.assert.calledWith(http.get, '/bars/123')
			});
			
			it('resource-route', function() {
            	client.bars(321).baz.get();
				sinon.assert.calledWith(http.get, '/bars/321/baz')
			});
            
            ['root', '/root', '/root/'].forEach(function(root) {
                it('root: ' + root, function() {
                    client = new Client(root, request);
				
				    client.foo.get();
				    sinon.assert.calledWith(http.get, '/root/foo');
                });
            });
			
			it('root: https://root', function() {
				client = new Client('https://root', request);
				client.foo.get();
				
				sinon.assert.calledWith(http.get, 'https://root/foo');
            });
				
            it('root: http://root', function() {
				client = new Client('http://root', request);
				client.foo.get();
				
				sinon.assert.calledWith(http.get, 'http://root/foo');
			});
			
			it('route with different path than name', function() {
				client = new Client(request);
				client.someRoute.get();
				
				sinon.assert.calledWith(http.get, '/some-route');
			});
			
			it('resource with different path than name', function() {
				client = new Client(request);
				client.someResource(42).get();
				
				sinon.assert.calledWith(http.get, '/some-resource/42');
			});
			
			it('resource with different path and a subroute path that is also different', function() {
				client = new Client(request);
				client.someResource(1).someRouteName.get();
				
				sinon.assert.calledWith(http.get, '/some-resource/1/some-route-name');
			});
		});
		
    });
});