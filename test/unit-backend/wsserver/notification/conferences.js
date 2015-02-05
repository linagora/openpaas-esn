'use strict';

var mockery = require('mockery');
var expect = require('chai').expect;

describe('The conferences notification WS module', function() {

  describe('init function', function() {
    beforeEach(function() {
      var JOINER_TOPIC = 'conference:join';
      var LEAVER_TOPIC = 'conference:leave';
      var self = this;
      this.userModule = {
        get: function(uid, callback) {
          return callback(null, {
            _id: uid,
            firstname: 'John',
            lastname: 'Doe'
          });
        }
      };
      this.pubsub = {
        topic: function(topic) {
          return {
            subscribe: function(callback) {
              if (topic === JOINER_TOPIC) {
                self.joiner_callback = callback;
              } else if (topic === LEAVER_TOPIC) {
                self.leaver_callback = callback;
              }
            }
          };
        }
      };
      this.io = {
        of: function() {
          return {
            on: function() {}
          };
        }
      };
      this.logger = this.helpers.requireFixture('logger-noop');
      this.core = {
        logger: this.logger,
        user: this.userModule,
        pubsub: {
          global: this.pubsub
        }
      };
      mockery.registerMock('../../core', this.core);
    });

    it('should register pubsub subscriber for conference:join event', function() {
      var mod = this.helpers.requireBackend('wsserver/notification/conferences');
      mod.init(this.io);
      expect(this.joiner_callback).to.be.a.function;
    });

    it('should register pubsub subscriber for conference:leave event', function() {
      var mod = this.helpers.requireBackend('wsserver/notification/conferences');
      mod.init(this.io);
      expect(this.leaver_callback).to.be.a.function;
    });

    describe('conference:join subscriber', function() {
      beforeEach(function() {
        var mod = this.helpers.requireBackend('wsserver/notification/conferences');
        mod.init(this.io);
      });
      it('should return the display name of the user in the message', function(done) {
        this.io.of = function() {
          return {
            'in': function() {
              return {
                emit: function(evt, msg) {
                  expect(msg.data.message).to.contain('John Doe');
                  done();
                }
              };
            }
          };
        };
        this.joiner_callback({user_id: 'user1', conference_id: 'conference1'});
      });
    });
    describe('conference:leave subscriber', function() {
      beforeEach(function() {
        var mod = this.helpers.requireBackend('wsserver/notification/conferences');
        mod.init(this.io);
      });
      it('should return the display name of the user in the message', function(done) {
        this.io.of = function() {
          return {
            'in': function() {
              return {
                emit: function(evt, msg) {
                  expect(msg.data.message).to.contain('John Doe');
                  done();
                }
              };
            }
          };
        };
        this.leaver_callback({user_id: 'user1', conference_id: 'conference1'});
      });
    });

  });


});
