'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The calendarAuthorizationHelper service', function() {
  var calendarAuthorizationHelper, calEventUtils, CALENDAR_AUTHORIZATIONS;
  var action, event;

  beforeEach(function() {
    calEventUtils = {
      isOrganizer: sinon.stub().returns(false)
    };

    event = {
      isPublic: sinon.stub().returns(false)
    };

    angular.mock.module('esn.calendar');

    angular.mock.module(function($provide) {
      $provide.value('calEventUtils', calEventUtils);
    });

    angular.mock.inject(function(_calendarAuthorizationHelper_, _calEventUtils_, _CALENDAR_AUTHORIZATIONS_) {
      calendarAuthorizationHelper = _calendarAuthorizationHelper_;
      calEventUtils = _calEventUtils_;
      CALENDAR_AUTHORIZATIONS = _CALENDAR_AUTHORIZATIONS_;
    });
  });

  describe('The isAllowedTo function', function() {
    it('should return false if action in unknown', function() {
      var result = calendarAuthorizationHelper.isAllowedTo('unknown', event);

      expect(event.isPublic).to.not.have.been.called;
      expect(calEventUtils.isOrganizer).to.not.have.been.called;
      expect(result).to.be.false;
    });

    describe('The isAllowedTo function with CALENDAR_AUTHORIZATIONS.ACCESS_EVENT_DETAIL action', function() {
      beforeEach(function() {
        action = CALENDAR_AUTHORIZATIONS.ACCESS_EVENT_DETAIL;
      });

      it('should return false if event is private and logger user is not the organizer of the event', function() {
        var result = calendarAuthorizationHelper.isAllowedTo(action, event);

        expect(event.isPublic).to.have.been.calledWith;
        expect(calEventUtils.isOrganizer).to.have.been.calledWith(event);
        expect(result).to.be.false;
      });

      it('should return true if event is public', function() {
        event.isPublic = sinon.stub().returns(true);
        var result = calendarAuthorizationHelper.isAllowedTo(action, event);

        expect(event.isPublic).to.have.been.calledWith;
        expect(calEventUtils.isOrganizer).to.not.have.been.called;
        expect(result).to.be.true;
      });

      it('should return true if logger user is the organizer of the event', function() {
        calEventUtils.isOrganizer = sinon.stub().returns(true);
        var result = calendarAuthorizationHelper.isAllowedTo(action, event);

        expect(event.isPublic).to.have.been.calledWith;
        expect(calEventUtils.isOrganizer).to.have.been.calledWith(event);
        expect(result).to.be.true;
      });
    });
  });
});
