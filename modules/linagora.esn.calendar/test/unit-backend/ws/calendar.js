'use strict';

var expect = require('chai').expect;
var ICAL = require('ical.js');
var fs = require('fs');
var sinon = require('sinon');
var CONSTANTS = require('../../../backend/lib/constants.js');

describe('The calendar WS events module', function() {

  describe('init function', function() {
    var self;

    beforeEach(function(done) {
      this.moduleHelpers.backendPath = this.moduleHelpers.modulesPath + 'linagora.esn.calendar/backend';
      var EVENT_UPDATED_TOPIC = 'calendar:event:updated';

      self = this;

      this.publishSpy = sinon.spy();

      this.pubsub = {
        global: {
          topic: function(topic) {
            return {
              subscribe: function(callback) {
                if (topic === EVENT_UPDATED_TOPIC) {
                  self.eventUpdatedPubsubCallback = callback;
                } else {
                  done(new Error('Should not have'));
                }
              }
            };
          }
        },
        local: {
          topic: sinon.spy(function() {
            return {
              publish: self.publishSpy
            };
          })
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
      expect(this.eventUpdatedPubsubCallback).to.be.a('function');
    });

    describe('calendar:event:updated subscriber', function() {
      var ics, jcal;

      beforeEach(function() {
        ics = fs.readFileSync(__dirname + '/../fixtures/meeting.ics', 'utf-8');
        jcal = new ICAL.Component.fromString(ics).jCal;
        ics = new ICAL.Component.fromString(ics).toString();
        var mod = require(this.moduleHelpers.backendPath + '/ws/calendar');

        mod.init(this.moduleHelpers.dependencies);
      });

      it('should return the message from the pubsub', function(done) {
        var event = {
          event: 'ICS',
          eventPath: 'calendar/123/events/1213.ics',
          websocketEvent: 'calendar:event:created'
        };

        this.helper.getUserSocketsFromNamespace = function(userId) {
          expect(userId).to.equal('123');
          var socket = {
            emit: function(wsEvent, _event) {
              expect(wsEvent).to.equal('calendar:event:created');
              expect(_event).to.equal(event);
              done();
            }
          };

          return [socket];
        };

        this.eventUpdatedPubsubCallback(event);
      });

      it('should call getUserSocketsFromNamespace for the owner of the calendar and the sharees', function() {
        var event = {
          event: 'ICS',
          eventPath: 'calendar/123/events/1213.ics',
          websocketEvent: 'calendar:event:created',
          shareeIds: [
            'principals/users/shareeId'
          ]
        };

        sinon.spy(this.helper, 'getUserSocketsFromNamespace');
        this.eventUpdatedPubsubCallback(event);

        expect(this.helper.getUserSocketsFromNamespace.firstCall).to.have.been.calledWith('123');
        expect(this.helper.getUserSocketsFromNamespace.secondCall).to.have.been.calledWith('shareeId');
      });

      it('should delete the ids of the sharee in the event object', function() {
        var event = {
          event: 'ICS',
          eventPath: 'calendar/123/events/1213.ics',
          websocketEvent: 'calendar:event:created',
          shareeIds: [
            'principals/users/shareeId'
          ]
        };

        this.eventUpdatedPubsubCallback(event);

        expect(event).to.be.deep.equal({
          event: 'ICS',
          eventPath: 'calendar/123/events/1213.ics',
          websocketEvent: 'calendar:event:created'
        });
      });

      function testLocalPublishOnWsEvent(wsEvent, localTopic) {
        self.eventUpdatedPubsubCallback({
          websocketEvent: wsEvent,
          event: jcal,
          eventPath: 'calendar/userId/events/eventId.ics'
        });

        var mod = require(self.moduleHelpers.backendPath + '/ws/calendar');

        mod.init(self.moduleHelpers.dependencies);

        expect(self.pubsub.local.topic).to.have.been.calledWith(localTopic);
        expect(self.publishSpy).to.have.been.calledWith({
          ics: ics,
          userId: 'userId',
          calendarId: 'events',
          eventUid: 'eventId'
        });
      }

      it('should push event creation on NOTIFICATIONS.EVENT_ADDED', function() {
        testLocalPublishOnWsEvent(CONSTANTS.WS_EVENT.EVENT_CREATED, CONSTANTS.NOTIFICATIONS.EVENT_ADDED);
      });

      it('should push event creation on NOTIFICATIONS.EVENT_REQUEST', function() {
        testLocalPublishOnWsEvent(CONSTANTS.WS_EVENT.EVENT_REQUEST, CONSTANTS.NOTIFICATIONS.EVENT_ADDED);
      });

      it('should push event creation on NOTIFICATIONS.EVENT_UPDATED', function() {
        testLocalPublishOnWsEvent(CONSTANTS.WS_EVENT.EVENT_UPDATED, CONSTANTS.NOTIFICATIONS.EVENT_UPDATED);
      });

      it('should push event creation on NOTIFICATIONS.EVENT_REPLY', function() {
        testLocalPublishOnWsEvent(CONSTANTS.WS_EVENT.EVENT_REPLY, CONSTANTS.NOTIFICATIONS.EVENT_UPDATED);
      });

      it('should push event creation on NOTIFICATIONS.EVENT_DELETED', function() {
        testLocalPublishOnWsEvent(CONSTANTS.WS_EVENT.EVENT_DELETED, CONSTANTS.NOTIFICATIONS.EVENT_DELETED);
      });

      it('should push event creation on NOTIFICATIONS.EVENT_CANCEL', function() {
        testLocalPublishOnWsEvent(CONSTANTS.WS_EVENT.EVENT_CANCEL, CONSTANTS.NOTIFICATIONS.EVENT_DELETED);
      });
    });

  });
});
