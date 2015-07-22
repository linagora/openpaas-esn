'use strict';

var chai = require('chai');
var expect = chai.expect;
var mockery = require('mockery');

describe('The proxy dispatcher module', function() {

  var dependencies = {
    logger: {
      error: function() {}
    }
  };
  var deps = function(name) {
    return dependencies[name];
  };

  var getHandler = function(name) {
    return require('../../../../backend/webserver/proxy/proxy')(deps)[name];
  };

  describe('The http function', function() {

    it('should send back 500 if proxy fails', function(done) {

      var proxy = function(path, options) {
        return function(req, res, next) {
          return next(new Error('You failed'));
        };
      };

      mockery.registerMock('express-http-proxy', proxy);
      mockery.registerMock('./graceperiod', function() {});

      getHandler('http')({},
        {
          json: function(code, body) {
            expect(code).to.equal(500);
            expect(body.error.details).to.match(/Error while sending request to service/);
            done();
          }
        },
        {endpoint: 'http://localhost'}
      );
    });

    it('should call proxy with options target', function(done) {

      var endpoint = 'http://localhost:9393';
      var options = {
        endpoint: endpoint
      };

      var proxy = function(path, options) {
        expect(path).to.equal('localhost:9393');
        done();
        return function() {};
      };

      mockery.registerMock('express-http-proxy', proxy);
      mockery.registerMock('./graceperiod', function() {});

      getHandler('http')({}, {}, options);
    });

    it('should call proxy with only host part of endpoint', function(done) {

      var endpoint = 'http://localhost:9393/some/path/here/';
      var options = {
        endpoint: endpoint
      };

      var proxy = function(path, options) {
        expect(path).to.equal('localhost:9393');
        done();
        return function() {};
      };

      mockery.registerMock('express-http-proxy', proxy);
      mockery.registerMock('./graceperiod', function() {});

      getHandler('http')({}, {}, options);
    });

    it('should prefix forwardPath with path-without-slash of endpoint', function(done) {
      var options = {
        path: 'addressbooks',
        endpoint: 'http://localhost:9393/path/without/slash'
      };

      var proxy = function(path, options) {
        expect(options.forwardPath({ url: '/123/contact.json' }))
          .to.equal('/path/without/slash/addressbooks/123/contact.json');
        done();
        return function() {};
      };

      mockery.registerMock('express-http-proxy', proxy);
      mockery.registerMock('./graceperiod', function() {});

      getHandler('http')({}, {}, options);
    });

    it('should prefix forwardPath with path-with-slash of endpoint', function(done) {
      var options = {
        path: 'addressbooks',
        endpoint: 'http://localhost:9393/path/with/slash/'
      };

      var proxy = function(path, options) {
        expect(options.forwardPath({ url: '/123/contact.json' }))
          .to.equal('/path/with/slash/addressbooks/123/contact.json');
        done();
        return function() {};
      };

      mockery.registerMock('express-http-proxy', proxy);
      mockery.registerMock('./graceperiod', function() {});

      getHandler('http')({}, {}, options);
    });
  });

  describe('The grace function', function() {

    it('should call the graceperiod module', function(done) {

      var req = {a: 1};
      var res = {b: 2};
      var opts = {c: 3};

      mockery.registerMock('http-proxy', {createProxyServer: function() {}});
      mockery.registerMock('./graceperiod', function() {
        return function(request, response, options) {
          expect(request).to.deep.equal(req);
          expect(response).to.deep.equal(res);
          expect(options).to.deep.equal(opts);
          done();
        };
      });

      getHandler('grace')(req, res, opts);
    });
  });
});
