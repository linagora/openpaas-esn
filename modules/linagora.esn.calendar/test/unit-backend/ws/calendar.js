'use strict';

const expect = require('chai').expect;
const ICAL = require('ical.js');
const fs = require('fs');
const _ = require('lodash');
const sinon = require('sinon');
const CONSTANTS = require('../../../backend/lib/constants');

describe('The calendar WS events module', function() {

  describe('init function', function() {
    var self;

    beforeEach(function(done) {
      this.moduleHelpers.backendPath = this.moduleHelpers.modulesPath + 'linagora.esn.calendar/backend';

      self = this;

      this.publishSpy = sinon.spy();
      this.subscribeSpy = sinon.spy(function(callback) {
        self.eventUpdatedPubsubCallback = callback;
      });

      this.pubsub = {
        global: {
          topic: sinon.spy(function() {
            return {
              subscribe: self.subscribeSpy
            };
          })
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
        debug: function() {},
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

    it('should register global pubsub subscribers for supported events', function() {
      var mod = require(this.moduleHelpers.backendPath + '/ws/calendar');

      mod.init(this.moduleHelpers.dependencies);
      _.forOwn(CONSTANTS.EVENTS.EVENT, topic => {
        expect(this.pubsub.global.topic).to.have.been.calledWith(topic);
      });
    });

    describe('When message is received in global pubsub', function() {
      var ics;

      beforeEach(function() {
        ics = fs.readFileSync(__dirname + '/../fixtures/meeting.ics', 'utf-8');
        ics = new ICAL.Component.fromString(ics).toString();
        var mod = require(this.moduleHelpers.backendPath + '/ws/calendar');

        mod.init(this.moduleHelpers.dependencies);
      });

      it('should return the message from the pubsub', function(done) {
        var event = {
          event: 'ICS',
          eventPath: 'calendar/123/events/1213.ics'
        };

        this.helper.getUserSocketsFromNamespace = function(userId) {
          expect(userId).to.equal('123');
          var socket = {
            emit: function(wsEvent, _event) {
              expect(wsEvent).to.exist;
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
          shareeIds: [
            'principals/users/shareeId'
          ]
        };

        this.eventUpdatedPubsubCallback(event);

        expect(event).to.be.deep.equal({
          event: 'ICS',
          eventPath: 'calendar/123/events/1213.ics'
        });
      });
    });
  });
});
