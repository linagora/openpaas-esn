'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The activitystreams pubsub module', function() {
  beforeEach(function() {
    this.helpers.mock.models({});
  });

  describe('processActivity fn', function() {
    beforeEach(function() {
      mockery.registerMock('../collaboration', {});
    });

    it('should call nothing when data is not set', function(done) {
      function callback(err, result) {
        expect(err.message).to.equal('Can not create activity from null data');
        done();
      }
      var pubsub = this.helpers.requireBackend('core/activitystreams/pubsub');
      pubsub.processActivity(null, callback);
    });

    it('should call the activitystream module when data is set and verb is post', function(done) {
      function callback(err, result) {
        done(err);
      }
      var mock = {
        addTimelineEntry: function() {
          done();
        }
      };

      mockery.registerMock('./index', mock);
      var pubsub = this.helpers.requireBackend('core/activitystreams/pubsub');
      pubsub.processActivity({ verb: 'post' }, callback);
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
      pubsub.processActivity({});
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
