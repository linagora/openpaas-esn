'use strict';

const expect = require('chai').expect;
const mockery = require('mockery');
const _ = require('lodash');
const sinon = require('sinon');
const CONSTANTS = require('../../../backend/lib/constants');

describe('The calendar WS events module', function() {
  describe('init function', function() {
    var self, eventHandler, calendarHandler;

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
            if (CONSTANTS.EVENTS.EVENT[name]) {
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
          var socket = {
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
      var mod = require(this.moduleHelpers.backendPath + '/ws/calendar');

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
        var mod = require(this.moduleHelpers.backendPath + '/ws/calendar');

        mod.init(this.moduleHelpers.dependencies);
      });

      it('should publish it to local and call eventHandler.notify', function() {
        var message = {foo: 'bar'};

        self.eventUpdatedPubsubCallback(message);

        expect(eventHandler.notify).to.have.been.calledWith(message);
        expect(self.publishSpy).to.have.been.calledWith(message);
      });
    });

    describe('When message is received in calendars global pubsub', function() {
      beforeEach(function() {
        var mod = require(this.moduleHelpers.backendPath + '/ws/calendar');

        mod.init(this.moduleHelpers.dependencies);
      });

      it('should call calendarHandler.notify', function() {
        var message = {foo: 'bar'};

        self.calendarUpdatedPubsubCallback(message);

        expect(calendarHandler.notify).to.have.been.calledWith(message);
        expect(self.publishSpy).to.not.have.been.called;
      });
    });
  });
});
