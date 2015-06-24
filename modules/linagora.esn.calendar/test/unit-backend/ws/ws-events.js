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
      this.io = {
        of: function() {
          return {
            on: function() {}
          };
        }
      };
      this.logger = {
        warn: function() {}
      };
      this.helper = {
        getUserSocketsFromNamespace: function() {}
      };
      this.moduleHelpers.addDep('logger', self.logger);
      this.moduleHelpers.addDep('wsserver', {io: self.io, ioHelper: self.helper});
      this.moduleHelpers.addDep('pubsub', self.pubsub);

      done();
    });

    it('should register pubsub subscriber for calendar:event:updated event', function() {
      var mod = require(this.moduleHelpers.backendPath + '/ws/ws-events');
      mod.init(this.moduleHelpers.dependencies);
      expect(this.pubsub_callback).to.be.a('function');
    });

    describe('calendar:event:updated subscriber', function() {

      beforeEach(function() {
        var mod = require(this.moduleHelpers.backendPath + '/ws/ws-events');
        mod.init(this.moduleHelpers.dependencies);
      });

      it('should return the message from the pubsub', function(done) {
        this.helper.getUserSocketsFromNamespace = function(userId) {
          expect(userId).to.equal('123');
          var socket = {
            emit: function(event, ics) {
              expect(event).to.equal('event:updated');
              expect(ics).to.equal('ICS');
              done();
            }
          };
          return [socket];
        };

        this.pubsub_callback({
          target: {
            _id: '123'
          },
          event: 'ICS'
        });
      });
    });

  });
});
