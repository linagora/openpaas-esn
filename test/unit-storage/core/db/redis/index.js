'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The redis module', function() {
  it('init should send back error on esnconfig error', function(done) {
    var logger = {
      error: function() {
      }
    };
    mockery.registerMock('../../../core/logger', logger);

    var esnconfig = function() {
      return {
        get: function(callback) {
          return callback(new Error());
        }
      };
    };
    mockery.registerMock('../../../core/esn-config', esnconfig);

    var redis = this.helpers.requireBackend('core').db.redis;
    redis.init(function(err) {
      expect(err).to.exist;
      done();
    });
  });

  it('init should initialize all when createClient send back right data', function(done) {
    var logger = {
      error: function() {
        done(new Error());
      },
      info: function() {}
    };
    mockery.registerMock('../../../core/logger', logger);

    var self = this;
    var esnconfig = function() {
      return {
        get: function(callback) {
          return callback(null, {
            host: 'localhost',
            port: self.testEnv.serversConfig.redis.port
          });
        }
      };
    };
    mockery.registerMock('../../../core/esn-config', esnconfig);

    var redis = this.helpers.requireBackend('core/db/redis');
    redis.init(function(err, client) {
      expect(err).to.not.exist;
      expect(client).to.exist;
      expect(redis.isInitialized()).to.be.true;
      done();
    });
  });
});
