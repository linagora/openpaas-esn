'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The activitystreams pubsub module', function() {

  beforeEach(function() {
    this.helpers.mock.models({});
  });

  describe('createActivity fn', function() {

    beforeEach(function() {
      mockery.registerMock('../collaboration', {});
    });


    it('should call nothing when data is not set', function(done) {
      var called = false;
      var mock = {
        addTimelineEntry: function() {
          called = true;
        }
      };
      mockery.registerMock('./index', mock);
      var pubsub = this.helpers.requireBackend('core/activitystreams/pubsub');
      pubsub.createActivity(null);
      expect(called).to.be.false;
      done();
    });

    it('should call the activitystream module when data is set', function(done) {
      var mock = {
        addTimelineEntry: function() {
          done();
        }
      };

      mockery.registerMock('./index', mock);
      var pubsub = this.helpers.requireBackend('core/activitystreams/pubsub');
      pubsub.createActivity({});
    });

    it('should call the callback if set', function(done) {
      var mock = {
        addTimelineEntry: function(data, callback) {
          return callback();
        }
      };

      mockery.registerMock('./index', mock);
      var pubsub = this.helpers.requireBackend('core/activitystreams/pubsub');
      pubsub.createActivity({}, function() {
        done();
      });
    });

    it('should display a warn if the callback is not set and if activitystream returns error', function(done) {
      var mock = {
        addTimelineEntry: function(data, callback) {
          return callback(new Error());
        }
      };
      mockery.registerMock('./index', mock);

      var logger = {
        warn: function() {
          done();
        }
      };
      mockery.registerMock('../logger', logger);

      var pubsub = this.helpers.requireBackend('core/activitystreams/pubsub');
      pubsub.createActivity({});
    });

    it('should display a debug if the callback is not set and if activitystream saved the activity', function(done) {
      var mock = {
        addTimelineEntry: function(data, callback) {
          return callback(null, {});
        }
      };
      mockery.registerMock('./index', mock);

      var logger = {
        debug: function() {
          done();
        }
      };
      mockery.registerMock('../logger', logger);

      var pubsub = this.helpers.requireBackend('core/activitystreams/pubsub');
      pubsub.createActivity({});
    });
  });

  describe('the init fn', function() {
    it('should call subscribe only two time', function(done) {
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
      var pubsub = this.helpers.requireBackend('core/activitystreams/pubsub');
      pubsub.init();
      pubsub.init();
      expect(nbCalls).to.equal(2);
      done();
    });
  });
});
