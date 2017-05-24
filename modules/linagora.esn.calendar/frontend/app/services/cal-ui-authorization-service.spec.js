'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The calUIAuthorizationService service', function() {
  var calUIAuthorizationService, calEventUtils, userId, CAL_DEFAULT_CALENDAR_ID, CAL_CALENDAR_PUBLIC_RIGHT, CAL_CALENDAR_SHARED_RIGHT;

  beforeEach(function() {
    calEventUtils = {
      isOrganizer: sinon.stub().returns(false)
    };

    userId = 'userId';

    angular.mock.module('esn.calendar');

    angular.mock.module(function($provide) {
      $provide.value('calEventUtils', calEventUtils);
    });

    angular.mock.inject(function(___, _calUIAuthorizationService_, _calEventUtils_, _CAL_DEFAULT_CALENDAR_ID_, _CAL_CALENDAR_PUBLIC_RIGHT_, _CAL_CALENDAR_SHARED_RIGHT_) {
      calUIAuthorizationService = _calUIAuthorizationService_;
      calEventUtils = _calEventUtils_;
      CAL_DEFAULT_CALENDAR_ID = _CAL_DEFAULT_CALENDAR_ID_;
      CAL_CALENDAR_PUBLIC_RIGHT = _CAL_CALENDAR_PUBLIC_RIGHT_;
      CAL_CALENDAR_SHARED_RIGHT = _CAL_CALENDAR_SHARED_RIGHT_;
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

    it('should return false if event is private and user is not the organizer of the event', function() {
      var result = calUIAuthorizationService.canAccessEventDetails(calendar, event, userId);

      expect(calEventUtils.isOrganizer).to.have.been.calledWith(event);
      expect(event.isPublic).to.have.been.calledWith;
      expect(result).to.be.false;
    });

    it('should return false if user is not the organizer of the event, event is public but user does not have read rights', function() {
      event.isPublic = sinon.stub().returns(true);

      var result = calUIAuthorizationService.canAccessEventDetails(calendar, event, userId);

      expect(calEventUtils.isOrganizer).to.have.been.calledWith(event);
      expect(event.isPublic).to.have.been.calledWith;
      expect(calendar.isReadable).to.have.been.calledWith(userId);
      expect(result).to.be.false;
    });

    it('should return true if user is the organizer of the event', function() {
      calEventUtils.isOrganizer = sinon.stub().returns(true);
      var result = calUIAuthorizationService.canAccessEventDetails(calendar, event, userId);

      expect(calEventUtils.isOrganizer).to.have.been.calledWith(event);
      expect(result).to.be.true;
    });

    it('should return true if event is public and user have read rights on the calendar', function() {
      event.isPublic = sinon.stub().returns(true);
      calendar.isReadable = sinon.stub().returns(true);
      var result = calUIAuthorizationService.canAccessEventDetails(calendar, event, userId);

      expect(calEventUtils.isOrganizer).to.have.been.calledWith(event);
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

    it('should return false if the user is not the owner or the calendar is not shared to the user', function() {
      var calendar = {
        id: CAL_DEFAULT_CALENDAR_ID + 'changed',
        isOwner: sinon.spy(function() {
          return false;
        }),
        isShared: sinon.spy(function() {
          return false;
        })
      };
      var userId = 'userId';

      expect(calUIAuthorizationService.canDeleteCalendar(calendar, userId)).to.be.false;
      expect(calendar.isOwner).to.have.been.calledWith(userId);
      expect(calendar.isShared).to.have.been.calledWith(userId);
    });

    it('should return true for the non-default calendars when the user is the owner', function() {
      var calendar = {
        id: CAL_DEFAULT_CALENDAR_ID + 'changed',
        isOwner: sinon.spy(function() {
          return true;
        }),
        isShared: sinon.spy(function() {
          return false;
        })
      };
      var userId = 'userId';

      expect(calUIAuthorizationService.canDeleteCalendar(calendar, userId)).to.be.true;
      expect(calendar.isOwner).to.have.been.calledWith(userId);
      expect(calendar.isShared).to.not.have.been.called;
    });

    it('should return true for the non-default calendars when the calendar is shared with the user', function() {
      var calendar = {
        id: CAL_DEFAULT_CALENDAR_ID + 'changed',
        isOwner: sinon.spy(function() {
          return false;
        }),
        isShared: sinon.spy(function() {
          return true;
        })
      };
      var userId = 'userId';

      expect(calUIAuthorizationService.canDeleteCalendar(calendar, userId)).to.be.true;
      expect(calendar.isOwner).to.have.been.calledWith(userId);
      expect(calendar.isShared).to.have.been.calledWith(userId);
    });
  });

  describe('the canModifyCalendarProperties function', function() {
    it('should return false if calendar is undefined', function() {
      expect(calUIAuthorizationService.canModifyCalendarProperties()).to.be.false;
    });

    it('should return false if the user is not the owner or the calendar is not shared to the user', function() {
      var calendar = {
        isOwner: sinon.spy(function() {
          return false;
        }),
        isShared: sinon.spy(function() {
          return false;
        })
      };
      var userId = 'userId';

      expect(calUIAuthorizationService.canModifyCalendarProperties(calendar, userId)).to.be.false;
      expect(calendar.isOwner).to.have.been.calledWith(userId);
      expect(calendar.isShared).to.have.been.calledWith(userId);
    });

    it('should return true for the non-default calendars when the user is the owner', function() {
      var calendar = {
        isOwner: sinon.spy(function() {
          return true;
        }),
        isShared: sinon.spy(function() {
          return false;
        })
      };
      var userId = 'userId';

      expect(calUIAuthorizationService.canModifyCalendarProperties(calendar, userId)).to.be.true;
      expect(calendar.isOwner).to.have.been.calledWith(userId);
      expect(calendar.isShared).to.not.have.been.called;
    });

    it('should return true for the non-default calendars when the calendar is shared with the user', function() {
      var calendar = {
        isOwner: sinon.spy(function() {
          return false;
        }),
        isShared: sinon.spy(function() {
          return true;
        })
      };
      var userId = 'userId';

      expect(calUIAuthorizationService.canModifyCalendarProperties(calendar, userId)).to.be.true;
      expect(calendar.isOwner).to.have.been.calledWith(userId);
      expect(calendar.isShared).to.have.been.calledWith(userId);
    });
  });

  describe('the canModifyEvent function', function() {
    var calendar, event, userId, publicRight, shareeRight;

    beforeEach(function() {
      calendar = {
        rights: {
          getPublicRight: sinon.spy(function() {
            return publicRight;
          }),
          getShareeRight: sinon.spy(function() {
            return shareeRight;
          })
        }
      };

      publicRight = CAL_CALENDAR_PUBLIC_RIGHT.READ;
      shareeRight = CAL_CALENDAR_SHARED_RIGHT.SHAREE_READ;

      event = {
        event: 'event'
      };
      userId = 'userId';

      calEventUtils.isNew = sinon.stub().returns(false);
    });

    it('should return true if new event', function() {
      calEventUtils.isNew = sinon.stub().returns(true);

      expect(calUIAuthorizationService.canModifyEvent(calendar, event, userId)).to.be.true;
      expect(calEventUtils.isNew).to.have.been.calledWith(event);
    });

    it('should return false if not new event and user is attendee and user does not have write rights on event calendar', function() {
      expect(calUIAuthorizationService.canModifyEventRecurrence(calendar, event, userId)).to.be.false;
      expect(calEventUtils.isOrganizer).to.have.been.calledWith(event);
      expect(calendar.rights.getPublicRight).to.have.been.calledWith;
      expect(calendar.rights.getShareeRight).to.have.been.calledWith(userId);
    });

    it('should return true if not new event and user is event organizer', function() {
      calEventUtils.isOrganizer = sinon.stub().returns(true);

      expect(calUIAuthorizationService.canModifyEvent(calendar, event, userId)).to.be.true;
      expect(calEventUtils.isOrganizer).to.have.been.calledWith(event);
      expect(calendar.rights.getPublicRight).to.have.been.calledWith;
      expect(calendar.rights.getShareeRight).to.have.been.calledWith(userId);
    });

    it('should return true if user is attendee of the event and but user have public write rights on the calendar', function() {
      publicRight = CAL_CALENDAR_PUBLIC_RIGHT.READ_WRITE;

      expect(calUIAuthorizationService.canModifyEvent(calendar, event, userId)).to.be.true;
      expect(calEventUtils.isOrganizer).to.have.been.calledWith(event);
      expect(calendar.rights.getPublicRight).to.have.been.calledWith;
      expect(calendar.rights.getShareeRight).to.have.been.calledWith(userId);
    });

    it('should return true if user is attendee of the event and but user have sharee write rights on the calendar', function() {
      shareeRight = CAL_CALENDAR_SHARED_RIGHT.SHAREE_READ_WRITE;

      expect(calUIAuthorizationService.canModifyEvent(calendar, event, userId)).to.be.true;
      expect(calEventUtils.isOrganizer).to.have.been.calledWith(event);
      expect(calendar.rights.getPublicRight).to.have.been.calledWith;
      expect(calendar.rights.getShareeRight).to.have.been.calledWith(userId);
    });
  });

  describe('the canModifyEventAttendees function', function() {
    var event;

    beforeEach(function() {
      event = 'event';
    });

    it('should return false if current user is not the event organizer', function() {
      calEventUtils.isOrganizer = sinon.stub().returns(false);

      expect(calUIAuthorizationService.canModifyEventAttendees(event)).to.be.false;
      expect(calEventUtils.isOrganizer).to.have.been.calledWith(event);
    });

    it('should return true if current user is the event organizer', function() {
      calEventUtils.isOrganizer = sinon.stub().returns(true);

      expect(calUIAuthorizationService.canModifyEventAttendees(event)).to.be.true;
      expect(calEventUtils.isOrganizer).to.have.been.calledWith(event);
    });

  });

  describe('the canModifyEventRecurrence function', function() {
    var calendar, event, userId, publicRight, shareeRight;

    beforeEach(function() {
      calendar = {
        rights: {
          getPublicRight: sinon.spy(function() {
            return publicRight;
          }),
          getShareeRight: sinon.spy(function() {
            return shareeRight;
          })
        }
      };

      publicRight = CAL_CALENDAR_PUBLIC_RIGHT.READ;
      shareeRight = CAL_CALENDAR_SHARED_RIGHT.SHAREE_READ;

      event = {
        isInstance: sinon.stub().returns(false)
      };

      userId = 'userId';
    });

    it('should return false if user is attendee and user does not have write rights on event calendar', function() {
      expect(calUIAuthorizationService.canModifyEventRecurrence(calendar, event, userId)).to.be.false;
      expect(calEventUtils.isOrganizer).to.have.been.calledWith(event);
      expect(calendar.rights.getPublicRight).to.have.been.calledWith;
      expect(calendar.rights.getShareeRight).to.have.been.calledWith(userId);
      expect(event.isInstance).to.have.been.calledWith;
    });

    it('should return false user is attendee and user can modify event but event is instance of recurrent event', function() {
      calEventUtils.isOrganizer = sinon.stub().returns(true);
      event.isInstance = sinon.stub().returns(true);

      expect(calUIAuthorizationService.canModifyEventRecurrence(calendar, event, userId)).to.be.false;
      expect(calEventUtils.isOrganizer).to.have.been.calledWith(event);
      expect(calendar.rights.getPublicRight).to.have.been.calledWith;
      expect(calendar.rights.getShareeRight).to.have.been.calledWith(userId);
      expect(event.isInstance).to.have.been.calledWith;
    });

    it('should return true if user is event organizer', function() {
      calEventUtils.isOrganizer = sinon.spy(function() {
        return true;
      });

      expect(calUIAuthorizationService.canModifyEventRecurrence(calendar, event, userId)).to.be.true;
      expect(calEventUtils.isOrganizer).to.have.been.calledWith(event);
      expect(event.isInstance).to.have.been.calledWith;
    });

    it('should return true if user is attendee of the event and but user have public write rights on the calendar', function() {
      publicRight = CAL_CALENDAR_PUBLIC_RIGHT.READ_WRITE;

      expect(calUIAuthorizationService.canModifyEventRecurrence(calendar, event, userId)).to.be.true;
      expect(calEventUtils.isOrganizer).to.have.been.calledWith(event);
      expect(calendar.rights.getPublicRight).to.have.been.calledWith;
      expect(calendar.rights.getShareeRight).to.have.been.calledWith(userId);
      expect(event.isInstance).to.have.been.calledWith;
    });

    it('should return true if user is attendee of the event and but user have sharee write rights on the calendar', function() {
      shareeRight = CAL_CALENDAR_SHARED_RIGHT.SHAREE_READ_WRITE;

      expect(calUIAuthorizationService.canModifyEventRecurrence(calendar, event, userId)).to.be.true;
      expect(calEventUtils.isOrganizer).to.have.been.calledWith(event);
      expect(calendar.rights.getPublicRight).to.have.been.calledWith;
      expect(calendar.rights.getShareeRight).to.have.been.calledWith(userId);
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
        isAdmin: sinon.stub().returns(true),
        isSubscription: sinon.stub().returns(false)
      };

      expect(calUIAuthorizationService.canModifyPublicSelection(calendar, userId)).to.be.true;
      expect(calendar.isAdmin).to.have.been.calledWith(userId);
    });

    it('should call calendar.isSubscription', function() {
      calendar = {
        isAdmin: sinon.stub().returns(true),
        isSubscription: sinon.stub().returns(false)
      };

      expect(calUIAuthorizationService.canModifyPublicSelection(calendar, userId)).to.be.true;
      expect(calendar.isSubscription).to.have.been.calledWith();
    });
  });

  describe('the canShowDelegationTab function', function() {
    var calendar;

    it('should return false if calendar is undefined', function() {
      expect(calUIAuthorizationService.canShowDelegationTab()).to.be.false;
    });

    it('should call calendar.isAdmin with userId', function() {
      calendar = {
        isAdmin: sinon.stub().returns(true),
        isSubscription: sinon.stub().returns(false)
      };

      expect(calUIAuthorizationService.canShowDelegationTab(calendar, userId)).to.be.true;
      expect(calendar.isAdmin).to.have.been.calledWith(userId);
    });

    it('should call calendar.isSubscription', function() {
      calendar = {
        isAdmin: sinon.stub().returns(true),
        isSubscription: sinon.stub().returns(false)
      };

      expect(calUIAuthorizationService.canShowDelegationTab(calendar, userId)).to.be.true;
      expect(calendar.isSubscription).to.have.been.calledWith();
    });
  });
});
