'use strict';

var expect = require('chai').expect;

describe('The calendar WS events module', function() {

  describe('init function', function() {

    beforeEach(function(done) {
      this.moduleHelpers.backendPath = this.moduleHelpers.modulesPath + 'linagora.esn.calendar/backend';
      var TOPIC = 'calendar:event:updated';
      var self = this;
      this.pubsub = {
        global: {
          topic: function(topic) {
            return {
              subscribe: function(callback) {
                if (topic === TOPIC) {
                  self.pubsub_callback = callback;
                } else {
                  done(new Error('Should not have'));
                }
              }
            };
          }
        }
      };
      this.socketListeners = {};
      this.io = {
        of: function() {
          var socket = {
            on: function(event, callback) {
              self.socketListeners[event] = callback;
            }
          };
          return {
            on: function(event, callback) {
              return callback(socket);
            }
          };
        }
      };
      this.logger = {
        warn: function() {},
        info: function() {},
        error: function() {}
      };
      this.helper = {
        getUserSocketsFromNamespace: function() {}
      };
      this.userModule = {};
      this.moduleHelpers.addDep('logger', self.logger);
      this.moduleHelpers.addDep('wsserver', {io: self.io, ioHelper: self.helper});
      this.moduleHelpers.addDep('pubsub', self.pubsub);
      this.moduleHelpers.addDep('user', self.userModule);

      done();
    });

    it('should register pubsub subscriber for calendar:event:updated event', function() {
      var mod = require(this.moduleHelpers.backendPath + '/ws/calendar');
      mod.init(this.moduleHelpers.dependencies);
      expect(this.pubsub_callback).to.be.a('function');
    });

    describe('calendar:event:updated subscriber', function() {

      beforeEach(function() {
        var mod = require(this.moduleHelpers.backendPath + '/ws/calendar');
        mod.init(this.moduleHelpers.dependencies);
      });

      it('should return the message from the pubsub', function(done) {
        var event = {
          event: 'ICS',
          eventPath: 'calendar/123/events/1213.ics',
          websocketEvent: 'calendar:ws:event:created'
        };

        this.helper.getUserSocketsFromNamespace = function(userId) {
          expect(userId).to.equal('123');
          var socket = {
            emit: function(wsEvent, _event) {
              expect(wsEvent).to.equal('calendar:ws:event:created');
              expect(_event).to.equal(event);
              done();
            }
          };
          return [socket];
        };

        this.pubsub_callback(event);
      });
    });

  });
});
