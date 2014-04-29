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
        addTimelineEntry: function(uuid, data, callback) {
          called = true;
        }
      };
      mockery.registerMock('./index', mock);
      var pubsub = require(this.testEnv.basePath + '/backend/core/activitystreams/pubsub');

      pubsub.saveMessageAsActivityEvent(null);
      expect(called).to.be.false;
      done();
    });

    it('should not call activity stream module when uuid is not set', function(done) {
      var called = false;
      var mock = {
        addTimelineEntry: function(data, callback) {
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
        addTimelineEntry: function(data, callback) {
          called = true;
        }
      };
      mockery.registerMock('./index', mock);
      var pubsub = require(this.testEnv.basePath + '/backend/core/activitystreams/pubsub');

      pubsub.saveMessageAsActivityEvent({user: '123'});
      expect(called).to.be.false;
      done();
    });

    it('should call activity stream module when message and user are set', function(done) {
      var data = {
        user: {firstname: 'foo'},
        message: {}
      };

      var mock = {
        addTimelineEntry: function(message, callback) {
          expect(message).to.deep.equal(data.message);
          done();
        }
      };

      var helper = {
        userMessageToTimelineEntry: function(message) {
          return message;
        }
      };
      mockery.registerMock('./index', mock);
      mockery.registerMock('./helpers', helper);

      var pubsub = require(this.testEnv.basePath + '/backend/core/activitystreams/pubsub');
      pubsub.saveMessageAsActivityEvent(data);
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
