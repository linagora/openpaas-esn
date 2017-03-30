'use strict';

var expect = require('chai').expect,
    mockery = require('mockery');

describe('The webserver setup-route middleware', function() {

  var configured = false;

  beforeEach(function() {
    this.routerMock = {
      get: function() {}
    };
    var configuredMock = function() {
      return configured;
    };

    const coreMock = {
      assets: {
        app: function() {}
      },
      configured: configuredMock.bind(this),
      db: {
        mongo: {}
      }
    };

    mockery.registerMock('../../core', coreMock);
  });

  it('should register a callback on the GET / endpoint', function() {
    var registered = {};
    var appMock = {
      get: function(path, callback) {
        registered[path] = callback;
      }
    };

    this.helpers.requireBackend('webserver/middleware/setup-routes')(appMock);

    expect(registered).to.have.property('/');
    expect(registered['/']).to.be.a.function;
  });

  describe('GET / callback', function() {

    it('should call res.render if the system is not yet configured', function(done) {
      configured = false;

      var responseMock = {
        locals: {},
        render: function(path) {
          expect(path).to.equal('setup/index');
          done();
        }
      };
      var appMock = {
        get: function(path, callback) {
          if (path === '/') {
            callback({}, responseMock, null);
          }
        }
      };

      this.helpers.requireBackend('webserver/middleware/setup-routes')(appMock);
    });

    it('should call next() if the system is configured', function(done) {
      configured = true;

      var nextMock = function() {
        done();
      };
      var appMock = {
        get: function(path, callback) {
          if (path === '/') {
            callback({}, {}, nextMock);
          }
        }
      };

      this.helpers.requireBackend('webserver/middleware/setup-routes')(appMock);
    });
  });

});
