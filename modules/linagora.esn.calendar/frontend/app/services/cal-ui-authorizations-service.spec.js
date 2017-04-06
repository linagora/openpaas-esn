'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The calUIAuthorizationService service', function() {
  var _, calUIAuthorizationService, calEventUtils, event, CAL_DEFAULT_CALENDAR_ID, CAL_CALENDAR_SHARED_RIGHT;

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

    angular.mock.inject(function(___, _calUIAuthorizationService_, _calEventUtils_, _CAL_DEFAULT_CALENDAR_ID_, _CAL_CALENDAR_SHARED_RIGHT_) {
      _ = ___;
      calUIAuthorizationService = _calUIAuthorizationService_;
      calEventUtils = _calEventUtils_;
      CAL_DEFAULT_CALENDAR_ID = _CAL_DEFAULT_CALENDAR_ID_;
      CAL_CALENDAR_SHARED_RIGHT = _CAL_CALENDAR_SHARED_RIGHT_;
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
      expect(calUIAuthorizationService.canDeleteCalendar({ id: CAL_DEFAULT_CALENDAR_ID })).to.be.false;
    });

    it('should return true if calendar.id is not the same as CAL_DEFAULT_CALENDAR_ID', function() {
      expect(calUIAuthorizationService.canDeleteCalendar({ id: CAL_DEFAULT_CALENDAR_ID + 'changed' })).to.be.true;
    });
  });

  describe('the canModifyPublicSelection function', function() {
    var userId, calendar, shareeRight, requiredSharedRightToModifyPublicSelection;

    beforeEach(function() {
      requiredSharedRightToModifyPublicSelection = [CAL_CALENDAR_SHARED_RIGHT.SHAREE_READ_WRITE, CAL_CALENDAR_SHARED_RIGHT.SHAREE_ADMIN];
      userId = 'userId';
      calendar = {
        rights: {
          getShareeRight: sinon.spy(function() {
            return shareeRight;
          })
        }
      };
    });

    it('should return true if calendar is undefined', function() {
      expect(calUIAuthorizationService.canModifyPublicSelection()).to.be.true;
    });

    it('should return true if calendar.rights is undefined', function() {
      expect(calUIAuthorizationService.canModifyPublicSelection({})).to.be.true;
    });

    it('should call calendar.rights.getShareeRight with userId', function() {
      calUIAuthorizationService.canModifyPublicSelection(calendar, userId);

      expect(calendar.rights.getShareeRight).to.have.been.calledWith(userId);
    });

    it('should return true if shareeRight is equal to CAL_CALENDAR_SHARED_RIGHT.SHAREE_READ_WRITE or CAL_CALENDAR_SHARED_RIGHT.SHAREE_ADMIN', function() {
      requiredSharedRightToModifyPublicSelection
        .forEach(function(sharedRightValue) {
          shareeRight = sharedRightValue;

          expect(calUIAuthorizationService.canModifyPublicSelection(calendar, userId)).to.be.true;
        });
    });

    it('should return false if shareeRight is not equal to CAL_CALENDAR_SHARED_RIGHT.SHAREE_READ_WRITE or CAL_CALENDAR_SHARED_RIGHT.SHAREE_ADMIN', function() {
      _.values(CAL_CALENDAR_SHARED_RIGHT)
        .filter(function(sharedRight) {
          return requiredSharedRightToModifyPublicSelection.indexOf(sharedRight) === -1;
        })
        .forEach(function(nonPermittedSharedRight) {
          shareeRight = nonPermittedSharedRight;

          expect(calUIAuthorizationService.canModifyPublicSelection(calendar, userId)).to.be.false;
        });
    });
  });
});
