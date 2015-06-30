'use strict';

var chai = require('chai');
var expect = chai.expect;
var mockery = require('mockery');

describe('The proxy module', function() {

  var endpoint = 'http://devhost:98298';
  var dependencies = {
    'esn-config': function() {
      return {
        get: function(callback) {
          return callback(null, {backend: {url: endpoint}});
        }
      };
    }
  };
  var deps = function(name) {
    return dependencies[name];
  };

  describe('The handle function', function() {

    describe('The result middleware', function() {

      it('should call the grace handler when req.query.graceperiod is defined', function(done) {

        var req = {query: {graceperiod: 1000}};
        var path = 'addressbooks';

        mockery.registerMock('./proxy', function() {
          return {
            grace: function(req, res, options) {
              expect(options.graceperiod).to.equal(req.query.graceperiod);
              expect(options.endpoint).to.equal(endpoint + '/' + path);
              done();
            }
          };
        });
        var middleware = require('../../../../backend/webserver/proxy')(deps).handle(path);
        middleware(req);
      });

      it('should call the http handler when req.query.graceperiod is undefined', function(done) {

        var req = {query: {}};
        var path = 'addressbooks';
        var endpoint = 'http://devhost:98298';

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
              expect(options.endpoint).to.equal(endpoint + '/' + path);
              done();
            }
          };
        });
        var middleware = require('../../../../backend/webserver/proxy')(deps).handle(path);
        middleware(req);
      });
    });
  });
});
