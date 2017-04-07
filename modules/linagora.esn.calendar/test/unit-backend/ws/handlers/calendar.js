'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');

describe('The websocket calendar handler module', function() {

  beforeEach(function() {
    var self = this;

    this.moduleHelpers.backendPath = this.moduleHelpers.modulesPath + 'linagora.esn.calendar/backend';
    this.socketListeners = {};
    this.io = {
      of: function() {
        return {};
      }
    };
    this.helper = {
      getUserSocketsFromNamespace: function() {}
    };
    this.moduleHelpers.addDep('logger', self.logger);
    this.moduleHelpers.addDep('wsserver', {io: self.io, ioHelper: self.helper});
  });

  describe('The notify function', function() {
    var userId, calendarId, topic;

    beforeEach(function() {
      userId = '123';
      calendarId = '456';
      topic = 'mytopic';
    });

    it('should call getUserSocketsFromNamespace for the owner of the calendar', function() {
      var message = {
        calendarPath: `/calendars/${userId}/${calendarId}.ics`
      };
      var module = require(this.moduleHelpers.backendPath + '/ws/handlers/calendar')(this.moduleHelpers.dependencies);

      sinon.spy(this.helper, 'getUserSocketsFromNamespace');
      module.notify(topic, message);

      expect(this.helper.getUserSocketsFromNamespace.firstCall).to.have.been.calledWith(userId);
    });

    it('should emit message on all the user websockets', function() {
      var websockets = [
        {emit: sinon.spy()},
        {emit: sinon.spy()},
        {emit: sinon.spy()}
      ];
      var message = {
        calendarPath: `/calendars/${userId}/${calendarId}.ics`
      };
      var module = require(this.moduleHelpers.backendPath + '/ws/handlers/calendar')(this.moduleHelpers.dependencies);
      var stub = sinon.stub(this.helper, 'getUserSocketsFromNamespace');

      stub.returns(websockets);
      module.notify(topic, message);

      websockets.forEach(function(websocket) {
        expect(websocket.emit).to.have.been.calledWith(topic, message);
      });
    });

    it('should not emit when calendarPath is invalid', function() {
      var message = {
        calendarPath: '/calendars'
      };
      var module = require(this.moduleHelpers.backendPath + '/ws/handlers/calendar')(this.moduleHelpers.dependencies);

      sinon.spy(this.helper, 'getUserSocketsFromNamespace');
      module.notify(topic, message);

      expect(this.helper.getUserSocketsFromNamespace).to.not.have.been.called;
    });
  });
});
