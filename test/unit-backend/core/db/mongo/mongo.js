'use strict';

var mockery = require('mockery');
var sinon = require('sinon');
var expect = require('chai').expect;

describe('The Core DB Mongo module', function() {

  describe('getConnectionString method', function() {
    var getConnectionString = null;

    beforeEach(function() {
      getConnectionString = this.helpers.requireBackend('core/db/mongo').getConnectionString;
    });

    it('should return a string mongodb://hostname:port/dbname', function() {
      expect(getConnectionString('localhost', 'port', 'base', null, null, {})).to.equal('mongodb://localhost:port/base');
    });

    it('should return a string mongodb://username:password@hostname:port/dbname', function() {
      expect(getConnectionString('localhost', 'port', 'base', 'user', 'pass', {})).to.equal('mongodb://user:pass@localhost:port/base');
    });
  });

  describe('connection status listener & emitter', function() {

    it('should register a listener on connected and disconnected events', function() {
      this.mongoose = this.helpers.requireFixture('mongoose').mongoose();
      var events = [];
      this.mongoose.connection.on = function(evt) {
        events.push(evt);
      };
      mockery.registerMock('mongoose', this.mongoose);
      this.mongo = this.helpers.requireBackend('core').db.mongo;
      expect(events).to.contain('connected');
      expect(events).to.contain('disconnected');
    });

    it('should expose a isConnected() method', function() {
      this.mongoose = this.helpers.requireFixture('mongoose').mongoose();
      mockery.registerMock('mongoose', this.mongoose);
      this.mongo = this.helpers.requireBackend('core').db.mongo;
      expect(this.mongo).to.respondTo('isConnected');
    });

    it('should publish a mongodb:connectionAvailable event when receiving a connected event', function(done) {
      this.mongoose = this.helpers.requireFixture('mongoose').mongoose();
      var events = {};
      this.mongoose.connection.on = function(evt, callback) {
        events[evt] = callback;
      };
      mockery.registerMock('mongoose', this.mongoose);
      var configmock = function() {
        return {
          get: function(callback) {
            return callback(new Error('Not useful'));
          }
        };
      };
      mockery.registerMock('../../../core/esn-config', configmock);
      mockery.registerMock('./global', {});

      this.mongo = this.helpers.requireBackend('core').db.mongo;
      this.mongo = this.helpers.requireBackend('core').db.redis;
      this.pubsub = this.helpers.requireBackend('core').pubsub.local;
      this.pubsub.topic('mongodb:connectionAvailable').subscribe(function() {
        done();
      });
      events.connected();
    });

    describe('The reconnect event', function() {

      var events;
      var mongoose;
      var forceReconnect;
      var reconnectAttemptCounter = 0;

      beforeEach(function() {
        mongoose = this.helpers.requireFixture('mongoose').mongoose();
        mongoose.connect = sinon.spy();
        events = {};
        mongoose.connection.on = function(evt, callback) {
          events[evt] = callback;
        };
        mockery.registerMock('mongoose', mongoose);
        var configMock = function() {
          return {
            db: {
              forceReconnectOnDisconnect: forceReconnect,
              attemptsLimit: 100
            }
          };
        };

        var core = {
          config: configMock,
          logger: this.helpers.requireFixture('logger-noop')(),
          pubsub: {
            local: {
              topic: function() {
                return {
                  publish: function() {
                  }
                };
              }
            }
          }
        };
        mockery.registerMock('../../../core', core);
      });

      it('should reconnect when disconnected and configured to reconnect', function() {
        var clock = sinon.useFakeTimers();
        var reconnectTimeout = 1;

        forceReconnect = true;
        reconnectAttemptCounter = reconnectAttemptCounter + 1;

        this.helpers.requireBackend('core').db.mongo;
        events.disconnected();
        clock.tick(reconnectTimeout * 1000);

        expect(mongoose.connect).to.have.been.calledOnce;
        clock.restore();
      });

      it('should not reconnect when disconnected and configured to reconnect', function() {
        forceReconnect = false;
        this.helpers.requireBackend('core').db.mongo;
        events.disconnected();
        expect(mongoose.connect).to.not.have.been.called;
      });
    });

    describe('isConnected() method', function() {
      it('should be false', function() {
        this.mongoose = this.helpers.requireFixture('mongoose').mongoose();
        mockery.registerMock('mongoose', this.mongoose);
        this.mongo = this.helpers.requireBackend('core').db.mongo;
        expect(this.mongo.isConnected()).to.be.false;
      });

      it('should be true after a connected event', function() {
        this.mongoose = this.helpers.requireFixture('mongoose').mongoose();
        var events = {};
        this.mongoose.connection.on = function(evt, callback) {
          events[evt] = callback;
        };
        mockery.registerMock('mongoose', this.mongoose);
        var configmock = function() {
          return {
            get: function(callback) {
              return callback(new Error('Not useful'));
            }
          };
        };
        mockery.registerMock('../../../core/esn-config', configmock);
        mockery.registerMock('./global', {});

        this.helpers.requireBackend('core').db.redis;
        this.mongo = this.helpers.requireBackend('core').db.mongo;
        events.connected();
        expect(this.mongo.isConnected()).to.be.true;
      });

      it('should be false after a connected and then a disconnected event', function() {
        this.mongoose = this.helpers.requireFixture('mongoose').mongoose();
        var events = {};
        this.mongoose.connection.on = function(evt, callback) {
          events[evt] = callback;
        };
        mockery.registerMock('mongoose', this.mongoose);
        var configmock = function() {
          return {
            get: function(callback) {
              return callback(new Error('Not useful'));
            }
          };
        };
        mockery.registerMock('../../../core/esn-config', configmock);
        mockery.registerMock('./global', {});

        this.helpers.requireBackend('core').db.redis;
        this.mongo = this.helpers.requireBackend('core').db.mongo;
        events.connected();
        events.disconnected();
        expect(this.mongo.isConnected()).to.be.false;
      });
    });
  });
});
