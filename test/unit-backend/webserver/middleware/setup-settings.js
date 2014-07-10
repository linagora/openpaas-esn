'use strict';

var mockery = require('mockery');
var expect = require('chai').expect;

describe('The setup settings middleware', function() {
  it('should inject openpass configuration in request if mongo is connected', function(done) {
    var config = {base_url: 'http://demo.openpaas.org'};
    var core = {
      logger: {
        info: function() {}
      },
      db: {
        mongo: {
          isConnected: function() {
            return true;
          }
        }
      },
      pubsub: {
        local: {
          topic: function() {
            return {
              subscribe: function(callback) {
              }
            };
          }
        }
      }
    };
    mockery.registerMock('../../core', core);

    var esnConf = function() {
      return {
        get: function(callback) {
          return callback(null, config);
        }
      };
    };
    mockery.registerMock('../../core/esn-config', esnConf);

    var setupSettings = require(this.testEnv.basePath + '/backend/webserver/middleware/setup-settings');
    var req = {};
    var res = {};
    setupSettings()(req, res, function() {
      expect(req.openpaas).to.exist;
      expect(req.openpaas.web).to.exist;
      expect(req.openpaas.web).to.deep.equal(config);
      expect(req.openpaas.getBaseURL()).to.equal(config.base_url);
      done();
    });
  });

  it('should not inject openpass configuration in request if mongo is not connected', function(done) {
    var config = {base_url: 'http://demo.openpaas.org'};
    var core = {
      logger: {
        info: function() {}
      },
      db: {
        mongo: {
          isConnected: function() {
            return false;
          }
        }
      },
      pubsub: {
        local: {
          topic: function() {
            return {
              subscribe: function(callback) {
              }
            };
          }
        }
      }
    };
    mockery.registerMock('../../core', core);

    var esnConf = function() {
      return {
        get: function(callback) {
          return callback(null, config);
        }
      };
    };
    mockery.registerMock('../../core/esn-config', esnConf);

    var setupSettings = require(this.testEnv.basePath + '/backend/webserver/middleware/setup-settings');
    var req = {
      protocol: 'http',
      get: function() {
        return 'localhost';
      }
    };
    var res = {};
    setupSettings()(req, res, function() {
      expect(req.openpaas).to.exist;
      expect(req.openpaas.web).to.exist;
      expect(req.openpaas.web).to.deep.equal({});
      expect(req.openpaas.getBaseURL()).to.equal('http://localhost');
      done();
    });
  });
});
