'use strict';

var chai = require('chai');
var expect = chai.expect;
var mockery = require('mockery');

describe('The proxy module', function() {

  var dependencies = {};
  var deps = function(name) {
    return dependencies[name];
  };

  describe('The handle function', function() {

    describe('The result middleware', function() {
      it('should call the configured dav server', function(done) {

        var path = 'addressbooks';
        var endpoint = 'http://devhost:98298';
        dependencies['esn-config'] = function() {
          return {
            get: function(callback) {
              return callback(null, {backend: {url: endpoint}});
            }
          };
        };

        var proxy = {
          createProxyServer: function() {
            return {
              web: function(req, res, options) {
                expect(options.target).to.equal(endpoint + '/' + path);
                done();
              }
            };
          }
        };
        mockery.registerMock('http-proxy', proxy);

        var middleware = require('../../../../backend/webserver/proxy')(deps).handle(path);

        var req = {};
        var res = {};
        var next = function() {
        };
        middleware(req, res, next);
      });

      it('should call the default dav server when not configured', function(done) {

        var path = 'addressbooks';
        dependencies['esn-config'] = function() {
          return {
            get: function(callback) {
              return callback();
            }
          };
        };

        var proxy = {
          createProxyServer: function() {
            return {
              web: function(req, res, options) {
                expect(options.target).to.equal('http://localhost:80/' + path);
                done();
              }
            };
          }
        };
        mockery.registerMock('http-proxy', proxy);
        var middleware = require('../../../../backend/webserver/proxy')(deps).handle(path);

        var req = {};
        var res = {};
        var next = function() {
        };
        middleware(req, res, next);
      });

      it('should call the default dav server when configuration fetch fails', function(done) {

        var path = 'addressbooks';
        dependencies['esn-config'] = function() {
          return {
            get: function(callback) {
              return callback(new Error());
            }
          };
        };

        var proxy = {
          createProxyServer: function() {
            return {
              web: function(req, res, options) {
                expect(options.target).to.equal('http://localhost:80/' + path);
                done();
              }
            };
          }
        };
        mockery.registerMock('http-proxy', proxy);
        var middleware = require('../../../../backend/webserver/proxy')(deps).handle(path);

        var req = {};
        var res = {};
        var next = function() {
        };
        middleware(req, res, next);
      });

      it('should send back 500 if proxy fails', function(done) {

        var path = 'addressbooks';
        dependencies['esn-config'] = function() {
          return {
            get: function(callback) {
              return callback();
            }
          };
        };

        var proxy = {
          createProxyServer: function() {
            return {
              web: function(req, res, options, callback) {
                return callback(new Error());
              }
            };
          }
        };
        mockery.registerMock('http-proxy', proxy);
        var middleware = require('../../../../backend/webserver/proxy')(deps).handle(path);

        var req = {};
        var res = {
          json: function(code) {
            expect(code).to.equal(500);
            done();
          }
        };
        var next = function() {
        };
        middleware(req, res, next);
      });
    });
  });
});
