'use strict';

var mockery = require('mockery');
var expect = require('chai').expect;

describe('The Core DB Mongo module', function() {

  describe('getConnectionString method', function() {
    var getConnectionString = null;

    beforeEach(function() {
      getConnectionString = require(this.testEnv.basePath + '/backend/core/db/mongo').getConnectionString;
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
      this.mongoose = require(this.testEnv.fixtures + '/mongoose').mongoose();
      var events = [];
      this.mongoose.connection.on = function(evt) {
        events.push(evt);
      };
      mockery.registerMock('mongoose', this.mongoose);
      this.mongo = require(this.testEnv.basePath + '/backend/core').db.mongo;
      expect(events).to.contain('connected');
      expect(events).to.contain('disconnected');
    });

    it('should expose a isConnected() method', function() {
      this.mongoose = require(this.testEnv.fixtures + '/mongoose').mongoose();
      mockery.registerMock('mongoose', this.mongoose);
      this.mongo = require(this.testEnv.basePath + '/backend/core').db.mongo;
      expect(this.mongo).to.respondTo('isConnected');
    });

    it('should publish a mongodb:connectionAvailable event when receiving a connected event', function(done) {
      this.mongoose = require(this.testEnv.fixtures + '/mongoose').mongoose();
      var events = {};
      this.mongoose.connection.on = function(evt, callback) {
        events[evt] = callback;
      };
      mockery.registerMock('mongoose', this.mongoose);
      this.mongo = require(this.testEnv.basePath + '/backend/core').db.mongo;
      this.pubsub = require(this.testEnv.basePath + '/backend/core').pubsub.local;
      this.pubsub.topic('mongodb:connectionAvailable').subscribe(function() {
        done();
      });
      events.connected();
    });

    describe('isConnected() method', function() {
      it('should be false', function() {
        this.mongoose = require(this.testEnv.fixtures + '/mongoose').mongoose();
        mockery.registerMock('mongoose', this.mongoose);
        this.mongo = require(this.testEnv.basePath + '/backend/core').db.mongo;
        expect(this.mongo.isConnected()).to.be.false;
      });

      it('should be true after a connected event', function() {
        this.mongoose = require(this.testEnv.fixtures + '/mongoose').mongoose();
        var events = {};
        this.mongoose.connection.on = function(evt, callback) {
          events[evt] = callback;
        };
        mockery.registerMock('mongoose', this.mongoose);
        this.mongo = require(this.testEnv.basePath + '/backend/core').db.mongo;
        events.connected();
        expect(this.mongo.isConnected()).to.be.true;
      });

      it('should be true after a connected and then a disconnected event', function() {
        this.mongoose = require(this.testEnv.fixtures + '/mongoose').mongoose();
        var events = {};
        this.mongoose.connection.on = function(evt, callback) {
          events[evt] = callback;
        };
        mockery.registerMock('mongoose', this.mongoose);
        this.mongo = require(this.testEnv.basePath + '/backend/core').db.mongo;
        events.connected();
        events.disconnected();
        expect(this.mongo.isConnected()).to.be.false;
      });
    });
  });
});
