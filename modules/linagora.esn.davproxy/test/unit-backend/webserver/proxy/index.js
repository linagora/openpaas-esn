'use strict';

var chai = require('chai');
var expect = chai.expect;
var mockery = require('mockery');

describe('The proxy module', function() {

  var deps, dependencies, endpoint;

  beforeEach(function() {
    endpoint = 'http://devhost:98298';
    dependencies = {};
    deps = function(name) {
      return dependencies[name];
    };
  });

  describe('The handle function', function() {

    describe('The result middleware', function() {

      it('should call the grace handler when req.query.graceperiod is defined', function(done) {

        var req = {query: {graceperiod: 1000}, davserver: endpoint};
        var path = 'addressbooks';

        mockery.registerMock('./proxy', function() {
          return {
            grace: function(req, res, options) {
              expect(options.graceperiod).to.equal(req.query.graceperiod);
              expect(options.endpoint).to.equal(endpoint);
              expect(options.path).to.equal(path);
              done();
            }
          };
        });
        var middleware = require('../../../../backend/webserver/proxy')(deps)(path).handle();
        middleware(req);
      });

      it('should call the http handler when req.query.graceperiod is undefined', function(done) {

        var req = {query: {}, davserver: endpoint, headers: {}};
        var path = 'addressbooks';

        dependencies['esn-config'] = function() {
          return {
            get: function(callback) {
              return callback(null, {backend: {url: endpoint}});
            }
          };
        };
        mockery.registerMock('./proxy', function() {
          return {
            http: function(req, res, options) {
              expect(options.endpoint).to.equal(endpoint);
              expect(options.path).to.equal(path);
              done();
            }
          };
        });
        var middleware = require('../../../../backend/webserver/proxy')(deps)(path).handle();
        middleware(req);
      });

      it('should add the ESNToken header to req if it exists', function(done) {
        var req = {query: {}, davserver: endpoint, headers: {}, token: {token: '123456789'}};
        var path = 'addressbooks';

        dependencies['esn-config'] = function() {
          return {
            get: function(callback) {
              return callback(null, {backend: {url: endpoint}});
            }
          };
        };
        mockery.registerMock('./proxy', function() {
          return {
            http: function(req, res, options) {
              expect(req.headers).to.deep.equal({
                ESNToken: '123456789'
              });
              done();
            }
          };
        });
        var middleware = require('../../../../backend/webserver/proxy')(deps)(path).handle();
        middleware(req);
      });

      it('should not add the ESNToken header if it is not defined', function(done) {
        var req = {query: {}, davserver: endpoint, headers: {}, token: {}};
        var path = 'addressbooks';

        dependencies['esn-config'] = function() {
          return {
            get: function(callback) {
              return callback(null, {backend: {url: endpoint}});
            }
          };
        };
        mockery.registerMock('./proxy', function() {
          return {
            http: function(req, res, options) {
              expect(req.headers).to.deep.equal({});
              done();
            }
          };
        });
        var middleware = require('../../../../backend/webserver/proxy')(deps)(path).handle();
        middleware(req);
      });

    });
  });
});
