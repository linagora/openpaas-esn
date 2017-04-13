'use strict';

const expect = require('chai').expect;
const mockery = require('mockery');
const _ = require('lodash');
const sinon = require('sinon');
const CONSTANTS = require('../../../backend/lib/constants');
const eventsName = Object.keys(CONSTANTS.EVENTS.EVENT).map(key => CONSTANTS.EVENTS.EVENT[key]);

describe('The calendar WS events module', function() {
  describe('init function', function() {
    let self, eventHandler, calendarHandler;

    beforeEach(function() {
      this.moduleHelpers.backendPath = this.moduleHelpers.modulesPath + 'linagora.esn.calendar/backend';

      self = this;

      this.publishSpy = sinon.spy();
      this.eventSubscribeSpy = sinon.spy(function(callback) {
        self.eventUpdatedPubsubCallback = callback;
      });

      this.calendarSubscribeSpy = sinon.spy(function(callback) {
        self.calendarUpdatedPubsubCallback = callback;
      });

      this.pubsub = {
        global: {
          topic: sinon.spy(function(name) {
            if (eventsName.indexOf(name) > -1) {
              return {
                subscribe: self.eventSubscribeSpy
              };
            }

            return {
              subscribe: self.calendarSubscribeSpy
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
      this.io = {
        of: function() {
          const socket = {
            on: function() {
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

      eventHandler = {
        notify: sinon.spy()
      };
      mockery.registerMock('./handlers/event', function() {
        return eventHandler;
      });

      calendarHandler = {
        notify: sinon.spy()
      };
      mockery.registerMock('./handlers/calendar', function() {
        return calendarHandler;
      });
    });

    it('should register global pubsub subscribers for supported events', function() {
      const mod = require(this.moduleHelpers.backendPath + '/ws/calendar');

      mod.init(this.moduleHelpers.dependencies);
      _.forOwn(CONSTANTS.EVENTS.EVENT, topic => {
        expect(this.pubsub.global.topic).to.have.been.calledWith(topic);
      });

      _.forOwn(CONSTANTS.EVENTS.CALENDAR, topic => {
        expect(this.pubsub.global.topic).to.have.been.calledWith(topic);
      });
    });

    describe('When message is received in events global pubsub', function() {
      beforeEach(function() {
        const mod = require(this.moduleHelpers.backendPath + '/ws/calendar');

        mod.init(this.moduleHelpers.dependencies);
      });

      it('should publish it to local and call eventHandler.notify', function() {
        const message = {foo: 'bar'};
        const lastKey = Object.keys(CONSTANTS.EVENTS.EVENT).pop();

        self.eventUpdatedPubsubCallback(message);

        expect(eventHandler.notify).to.have.been.calledWith(CONSTANTS.EVENTS.EVENT[lastKey], message);
        expect(self.publishSpy).to.have.been.calledWith(message);
      });
    });

    describe('When message is received in calendars global pubsub', function() {
      beforeEach(function() {
        const mod = require(this.moduleHelpers.backendPath + '/ws/calendar');

        mod.init(this.moduleHelpers.dependencies);
      });

      it('should call calendarHandler.notify', function() {
        const message = {foo: 'bar'};
        const lastKey = Object.keys(CONSTANTS.EVENTS.CALENDAR).pop();

        self.calendarUpdatedPubsubCallback(message);

        expect(calendarHandler.notify).to.have.been.calledWith(CONSTANTS.EVENTS.CALENDAR[lastKey], message);
        expect(self.publishSpy).to.not.have.been.called;
      });
    });
  });
});
