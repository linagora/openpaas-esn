'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The activitystreams pubsub module', function() {

  beforeEach(function() {
    var mock = {
      model: function() {
        return {};
      }
    };
    this.mongoose = mockery.registerMock('mongoose', mock);
  });

  describe('saveMessageAsActivityEvent fn', function() {

    it('should not call activity stream module when data is not set', function(done) {
      var called = false;
      var mock = {
        addTimelineEntry: function() {
          called = true;
        }
      };
      mockery.registerMock('./index', mock);
      var pubsub = require(this.testEnv.basePath + '/backend/core/activitystreams/pubsub');

      pubsub.saveMessageAsActivityEvent(null);
      expect(called).to.be.false;
      done();
    });

    it('should not call activity stream module when data is empty', function(done) {
      var called = false;
      var mock = {
        addTimelineEntry: function() {
          called = true;
        }
      };
      mockery.registerMock('./index', mock);
      var pubsub = require(this.testEnv.basePath + '/backend/core/activitystreams/pubsub');

      pubsub.saveMessageAsActivityEvent({});
      expect(called).to.be.false;
      done();
    });

    it('should not call activity stream module when message is not set', function(done) {
      var called = false;
      var mock = {
        addTimelineEntry: function() {
          called = true;
        }
      };
      mockery.registerMock('./index', mock);
      var pubsub = require(this.testEnv.basePath + '/backend/core/activitystreams/pubsub');

      pubsub.saveMessageAsActivityEvent({source: {type: 'user', resource: 1234}, verb: 'post', targets: [{foo: 'bar'}]});
      expect(called).to.be.false;
      done();
    });

    it('should not call activity stream module when source is not set', function(done) {
      var called = false;
      var mock = {
        addTimelineEntry: function() {
          called = true;
        }
      };
      mockery.registerMock('./index', mock);
      var pubsub = require(this.testEnv.basePath + '/backend/core/activitystreams/pubsub');

      pubsub.saveMessageAsActivityEvent({message: 123, verb: 'post', targets: [{foo: 'bar'}]});
      expect(called).to.be.false;
      done();
    });

    it('should not call activity stream module when source resource is not set', function(done) {
      var called = false;
      var mock = {
        addTimelineEntry: function() {
          called = true;
        }
      };
      mockery.registerMock('./index', mock);
      var pubsub = require(this.testEnv.basePath + '/backend/core/activitystreams/pubsub');

      pubsub.saveMessageAsActivityEvent({source: {}, verb: 'post', message: 123, targets: [{foo: 'bar'}]});
      expect(called).to.be.false;
      done();
    });

    it('should not call activity stream module when targets is not set', function(done) {
      var called = false;
      var mock = {
        addTimelineEntry: function() {
          called = true;
        }
      };
      mockery.registerMock('./index', mock);
      var pubsub = require(this.testEnv.basePath + '/backend/core/activitystreams/pubsub');

      pubsub.saveMessageAsActivityEvent({source: {type: 'user', resource: 123}, verb: 'post', message: 123});
      expect(called).to.be.false;
      done();
    });

    it('should not call activity stream module when targets is empty', function(done) {
      var called = false;
      var mock = {
        addTimelineEntry: function() {
          called = true;
        }
      };
      mockery.registerMock('./index', mock);
      var pubsub = require(this.testEnv.basePath + '/backend/core/activitystreams/pubsub');

      pubsub.saveMessageAsActivityEvent({source: {type: 'user', resource: 123}, verb: 'post', message: 123, targets: []});
      expect(called).to.be.false;
      done();
    });

    it('should not call activity stream module when verb is empty', function(done) {
      var called = false;
      var mock = {
        addTimelineEntry: function() {
          called = true;
        }
      };
      mockery.registerMock('./index', mock);
      var pubsub = require(this.testEnv.basePath + '/backend/core/activitystreams/pubsub');

      pubsub.saveMessageAsActivityEvent({source: {type: 'user', resource: 123}, message: 123, targets: []});
      expect(called).to.be.false;
      done();
    });

    it('should call activity stream module when data is fully set', function(done) {
      var data = {
        source: {type: 'user', resource: 123},
        message: 123,
        targets: [{foo: 'bar'}],
        verb: 'post'
      };

      var mock = {
        addTimelineEntry: function() {
          done();
        }
      };

      var helper = {
        userMessageToTimelineEntry: function(message) {
          return message;
        }
      };

      var userMock = {
        get: function(uuid, callback) {
          return callback(null, {_id: uuid});
        }
      };

      mockery.registerMock('./index', mock);
      mockery.registerMock('./helpers', helper);
      mockery.registerMock('../user', userMock);

      var pubsub = require(this.testEnv.basePath + '/backend/core/activitystreams/pubsub');
      pubsub.saveMessageAsActivityEvent(data);
    });

    it('should not call activity stream module when user module send back an error', function(done) {
      var data = {
        source: {type: 'user', resource: 123},
        message: 123,
        targets: [{foo: 'bar'}],
        verb: 'post'
      };
      var called = false;

      var mock = {
        addTimelineEntry: function() {
          called = true;
        }
      };

      var helper = {
        userMessageToTimelineEntry: function(message) {
          return message;
        }
      };

      var messageMock = {
        get: function(uuid, callback) {
          return callback(null, {_id: uuid});
        }
      };

      var userMock = {
        get: function(uuid, callback) {
          return callback(new Error());
        }
      };

      mockery.registerMock('./index', mock);
      mockery.registerMock('./helpers', helper);
      mockery.registerMock('../message', messageMock);
      mockery.registerMock('../user', userMock);

      var pubsub = require(this.testEnv.basePath + '/backend/core/activitystreams/pubsub');
      pubsub.saveMessageAsActivityEvent(data);
      expect(called).to.be.false;
      done();
    });

    it('should not call activity stream module when user is not found', function(done) {
      var data = {
        source: {type: 'user', resource: 123},
        message: 123,
        targets: [{foo: 'bar'}],
        verb: 'post'
      };
      var called = false;

      var mock = {
        addTimelineEntry: function() {
          called = true;
        }
      };

      var helper = {
        userMessageToTimelineEntry: function(message) {
          return message;
        }
      };

      var userMock = {
        get: function(uuid, callback) {
          return callback(null, null);
        }
      };

      mockery.registerMock('./index', mock);
      mockery.registerMock('./helpers', helper);
      mockery.registerMock('../user', userMock);

      var pubsub = require(this.testEnv.basePath + '/backend/core/activitystreams/pubsub');
      pubsub.saveMessageAsActivityEvent(data);
      expect(called).to.be.false;
      done();
    });
  });

  describe('the init fn', function() {
    it('should call subscribe only one time', function(done) {
      var nbCalls = 0;
      var mock = {
        local: {
          topic: function(topic) {
            return {
              subscribe: function() {
                nbCalls++;
              }
            };
          }
        }
      };

      mockery.registerMock('../pubsub', mock);
      var pubsub = require(this.testEnv.basePath + '/backend/core/activitystreams/pubsub');
      pubsub.init();
      pubsub.init();
      expect(nbCalls).to.equal(1);
      done();
    });
  });
});
