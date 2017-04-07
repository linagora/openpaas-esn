'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The calUIAuthorizationService service', function() {
  var calUIAuthorizationService, calEventUtils, event, userId, CAL_DEFAULT_CALENDAR_ID;

  beforeEach(function() {
    calEventUtils = {
      isOrganizer: sinon.stub().returns(false)
    };

    event = {
      isPublic: sinon.stub().returns(false)
    };

    userId = 'userId';

    angular.mock.module('esn.calendar');

    angular.mock.module(function($provide) {
      $provide.value('calEventUtils', calEventUtils);
    });

    angular.mock.inject(function(___, _calUIAuthorizationService_, _calEventUtils_, _CAL_DEFAULT_CALENDAR_ID_) {
      calUIAuthorizationService = _calUIAuthorizationService_;
      calEventUtils = _calEventUtils_;
      CAL_DEFAULT_CALENDAR_ID = _CAL_DEFAULT_CALENDAR_ID_;
    });
  });

  describe('The canAccessEventDetails function', function() {
    it('should return false if event is private and logger user is not the organizer of the event', function() {
      var result = calUIAuthorizationService.canAccessEventDetails(event);

      expect(event.isPublic).to.have.been.calledWith;
      expect(calEventUtils.isOrganizer).to.have.been.calledWith(event);
      expect(result).to.be.false;
    });

    it('should return true if event is public', function() {
      event.isPublic = sinon.stub().returns(true);
      var result = calUIAuthorizationService.canAccessEventDetails(event);

      expect(event.isPublic).to.have.been.calledWith;
      expect(calEventUtils.isOrganizer).to.not.have.been.called;
      expect(result).to.be.true;
    });

    it('should return true if logger user is the organizer of the event', function() {
      calEventUtils.isOrganizer = sinon.stub().returns(true);
      var result = calUIAuthorizationService.canAccessEventDetails(event);

      expect(event.isPublic).to.have.been.calledWith;
      expect(calEventUtils.isOrganizer).to.have.been.calledWith(event);
      expect(result).to.be.true;
    });
  });

  describe('the canDeleteCalendar function', function() {
    it('should return false if calendar is undefined', function() {
      expect(calUIAuthorizationService.canDeleteCalendar()).to.be.false;
    });

    it('should return false if calendar.id is the same as CAL_DEFAULT_CALENDAR_ID', function() {
      expect(calUIAuthorizationService.canDeleteCalendar({id: CAL_DEFAULT_CALENDAR_ID})).to.be.false;
    });

    it('should return true if calendar.id is not the same as CAL_DEFAULT_CALENDAR_ID', function() {
      expect(calUIAuthorizationService.canDeleteCalendar({id: CAL_DEFAULT_CALENDAR_ID + 'changed'})).to.be.true;
    });
  });

  describe('the canModifyEventRecurrence function', function() {
    var calendar;

    it('should return false if calendar is undefined', function() {
      expect(calUIAuthorizationService.canModifyEventRecurrence()).to.be.false;
    });

    it('should return false if calendar is defined event is undefined', function() {
      calendar = {
        isWritable: sinon.stub().returns(true)
      };
      expect(calUIAuthorizationService.canModifyEventRecurrence()).to.be.false;
    });

    it('should call calendar.isWritable with userId and check if event is not an recurrent event instance', function() {
      calendar = {
        isWritable: sinon.stub().returns(true)
      };
      event = {
        isInstance: sinon.stub().returns(false)
      };

      expect(calUIAuthorizationService.canModifyEventRecurrence(calendar, event, userId)).to.be.true;
      expect(calendar.isWritable).to.have.been.calledWith(userId);
      expect(event.isInstance).to.have.been.calledWith;
    });
  });

  describe('the canModifyPublicSelection function', function() {
    var calendar;

    it('should return false if calendar is undefined', function() {
      expect(calUIAuthorizationService.canModifyPublicSelection()).to.be.false;
    });

    it('should call calendar.isAdmin with userId', function() {
      calendar = {
        isAdmin: sinon.stub().returns(true)
      };

      expect(calUIAuthorizationService.canModifyPublicSelection(calendar, userId)).to.be.true;
      expect(calendar.isAdmin).to.have.been.calledWith(userId);
    });
  });

  describe('the canShowDelegationTab function', function() {
    var calendar;

    it('should return false if calendar is undefined', function() {
      expect(calUIAuthorizationService.canShowDelegationTab()).to.be.false;
    });

    it('should call calendar.isAdmin with userId', function() {
      calendar = {
        isAdmin: sinon.stub().returns(true)
      };

      expect(calUIAuthorizationService.canShowDelegationTab(calendar, userId)).to.be.true;
      expect(calendar.isAdmin).to.have.been.calledWith(userId);
    });
  });
});
