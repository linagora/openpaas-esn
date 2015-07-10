'use strict';

var chai = require('chai');
var expect = chai.expect;
var mockery = require('mockery');

describe('The addressbooks module', function() {

  var deps, dependencies;
  var endpoint = 'http://devhost:98298';

  beforeEach(function() {
    dependencies = {
      'esn-config': function() {
        return {
          get: function(callback) {
            return callback(null, {backend: {url: endpoint}});
          }
        };
      },
      logger: {
        error: function() {
        }
      }
    };
    deps = function(name) {
      return dependencies[name];
    };
  });

  var getController = function() {
    return require('../../../../backend/webserver/addressbooks/controller')(deps);
  };

  describe('The getContact function', function() {

    var req;
    beforeEach(function() {
      req = {
        token: {
          token: 123
        },
        davserver: 'http://dav:8080',
        url: '/foo/bar'
      };
    });

    it('should set right parameters', function(done) {
      mockery.registerMock('../proxy/http-client', function(options) {
        expect(options.headers.ESNToken).to.equal(req.token.token);
        expect(options.json).to.be.true;
        done();
      });

      getController().getContact(req);
    });

    it('should send back HTTP 500 if http client call fails', function(done) {
      mockery.registerMock('../proxy/http-client', function(options, callback) {
        return callback(new Error('You failed'));
      });

      getController().getContact(req, {
        json: function(code, json) {
          expect(code).to.equal(500);
          expect(json.error.details).to.match(/Error while getting contact from DAV server/);
          done();
        }
      });
    });

    it('should send back client response status code and body', function(done) {
      var statusCode = 200;
      var body = {foo: 'bar'};

      mockery.registerMock('../proxy/http-client', function(options, callback) {
        return callback(null, {statusCode: statusCode}, body);
      });

      getController().getContact(req, {
        json: function(code, json) {
          expect(code).to.equal(statusCode);
          expect(json).to.deep.equal(body);
          done();
        }
      });
    });
  });

  describe('The updateContact function', function() {

    var req;
    beforeEach(function() {
      req = {
        token: {
          token: 123
        },
        davserver: 'http://dav:8080',
        url: '/foo/bar'
      };
    });

    it('should set right parameters', function(done) {
      mockery.registerMock('../proxy/http-client', function(options) {
        expect(options.headers.ESNToken).to.equal(req.token.token);
        expect(options.json).to.be.true;
        expect(options.method).to.equal('PUT');
        done();
      });

      getController().updateContact(req);
    });

    it('should send back HTTP 500 if http client call fails', function(done) {
      mockery.registerMock('../proxy/http-client', function(options, callback) {
        return callback(new Error('You failed'));
      });

      getController().updateContact(req, {
        json: function(code, json) {
          expect(code).to.equal(500);
          expect(json.error.details).to.match(/Error while updating contact on DAV server/);
          done();
        }
      });
    });

    it('should send back client response status code and body', function(done) {
      var statusCode = 200;
      var body = {foo: 'bar'};

      mockery.registerMock('../proxy/http-client', function(options, callback) {
        return callback(null, {statusCode: statusCode}, body);
      });

      getController().updateContact(req, {
        json: function(code, json) {
          expect(code).to.equal(statusCode);
          expect(json).to.deep.equal(body);
          done();
        }
      });
    });
  });

  describe('The deleteContact function', function() {

    it('should call the proxy module', function(done) {
      mockery.registerMock('../proxy', function() {
        return function() {
          return {
            handle: function(options) {
              expect(options.onSuccess).to.be.a.function;
              expect(options.onError).to.be.a.function;
              return function() {
                done();
              };
            }
          };
        };
      });
      getController().deleteContact();
    });
  });

  describe('The defaultHandler function', function() {

    it('should call the proxy module', function(done) {
      mockery.registerMock('../proxy', function() {
        return function() {
          return {
            handle: function() {
              return function() {
                done();
              };
            }
          };
        };
      });
      getController().defaultHandler();
    });
  });
});
