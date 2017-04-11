'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The calUIAuthorizationService service', function() {
  var calUIAuthorizationService, calEventUtils, event, userId, CAL_DEFAULT_CALENDAR_ID;

  beforeEach(function() {
    calEventUtils = {
      isOrganizer: sinon.stub().returns(false)
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
    var calendar, event;

    beforeEach(function() {
      event = {
        isPublic: sinon.stub().returns(false)
      };

      calendar = {
        isOwner: sinon.stub().returns(false),
        isReadable: sinon.stub().returns(false)
      };

      userId = 'userId';
    });

    it('should return false if event is private and user is not the owner of the calendar', function() {
      var result = calUIAuthorizationService.canAccessEventDetails(calendar, event, userId);

      expect(calendar.isOwner).to.have.been.calledWith(userId);
      expect(event.isPublic).to.have.been.calledWith;
      expect(result).to.be.false;
    });

    it('should return false if user is not the owner of the calendar, event is public but user does not have read rights', function() {
      event.isPublic = sinon.stub().returns(true);

      var result = calUIAuthorizationService.canAccessEventDetails(calendar, event, userId);

      expect(calendar.isOwner).to.have.been.calledWith(userId);
      expect(event.isPublic).to.have.been.calledWith;
      expect(calendar.isReadable).to.have.been.calledWith(userId);
      expect(result).to.be.false;
    });

    it('should return true if user is the owner of the calendar', function() {
      calendar.isOwner = sinon.stub().returns(true);
      var result = calUIAuthorizationService.canAccessEventDetails(calendar, event, userId);

      expect(calendar.isOwner).to.have.been.calledWith(userId);
      expect(event.isPublic).to.not.have.been.called;
      expect(result).to.be.true;
    });

    it('should return true if event is public and user have read rights on the calendar', function() {
      event.isPublic = sinon.stub().returns(true);
      calendar.isReadable = sinon.stub().returns(true);
      var result = calUIAuthorizationService.canAccessEventDetails(calendar, event, userId);

      expect(calendar.isOwner).to.have.been.calledWith(userId);
      expect(event.isPublic).to.have.been.calledWith;
      expect(calendar.isReadable).to.have.been.calledWith(userId);
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

  describe('the canModifyEvent function', function() {
    var calendar, event, userId;

    beforeEach(function() {
      calendar = {
        isWritable: sinon.stub().returns(false)
      };

      event = {
        event: 'event'
      };
      userId = 'userId';

      calEventUtils.isNew = sinon.spy(function() {
        return false;
      });
    });

    it('should return true if new event', function() {
      calEventUtils.isNew = sinon.spy(function() {
        return true;
      });

      expect(calUIAuthorizationService.canModifyEvent(calendar, event, userId)).to.be.true;
      expect(calEventUtils.isNew).to.have.been.calledWith(event);
    });

    it('should return false if not new event and calendar is not writable', function() {
      expect(calUIAuthorizationService.canModifyEvent(calendar, event, userId)).to.be.false;
      expect(calendar.isWritable).to.have.been.calledWith(userId);
    });

    it('should return true if not new event and calendar is writable', function() {
      calendar = {
        isWritable: sinon.stub().returns(true)
      };

      expect(calUIAuthorizationService.canModifyEvent(calendar, event, userId)).to.be.true;
      expect(calendar.isWritable).to.have.been.calledWith(userId);
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
