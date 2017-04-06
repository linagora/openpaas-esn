'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The calendar configuration tab delegation controller', function() {
  var $rootScope,
    $controller,
    $scope,
    $state,
    $q,
    _,
    calendarService,
    calUIAuthorizationService,
    userUtils,
    session,
    CalendarConfigurationTabMainController,
    CAL_CALENDAR_PUBLIC_RIGHT,
    CAL_CALENDAR_SHARED_RIGHT;

  function initController() {
    return $controller('CalendarConfigurationTabMainController', { $scope: $scope });
  }

  beforeEach(function() {
    calendarService = {
      removeCalendar: sinon.spy(function() {
        return $q.when();
      })
    };
  });

  beforeEach(function() {
    angular.mock.module('esn.calendar', function($provide) {
      $provide.value('calendarService', calendarService);
    });

    angular.mock.inject(function(_$rootScope_, _$controller_, _$state_, _$q_, ___, _session_, _userUtils_, _CAL_CALENDAR_PUBLIC_RIGHT_, _CAL_CALENDAR_SHARED_RIGHT_, _calUIAuthorizationService_) {
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $controller = _$controller_;
      $state = _$state_;
      $q = _$q_;
      _ = ___;
      userUtils = _userUtils_;
      session = _session_;
      calUIAuthorizationService = _calUIAuthorizationService_;
      CAL_CALENDAR_PUBLIC_RIGHT = _CAL_CALENDAR_PUBLIC_RIGHT_;
      CAL_CALENDAR_SHARED_RIGHT = _CAL_CALENDAR_SHARED_RIGHT_;
    });
  });

  beforeEach(function() {
    CalendarConfigurationTabMainController = initController();
    sinon.spy($state, 'go');
  });

  describe('the $onInit', function() {
    it('should initialize self.publicRights with an array contains the different rights', function() {
      var publicRightsExpected = [
        {
          value: CAL_CALENDAR_PUBLIC_RIGHT.READ,
          name: 'Read'
        },
        {
          value: CAL_CALENDAR_PUBLIC_RIGHT.READ_WRITE,
          name: 'Write'
        }, {
          value: CAL_CALENDAR_PUBLIC_RIGHT.FREE_BUSY,
          name: 'Private'
        }, {
          value: CAL_CALENDAR_PUBLIC_RIGHT.NONE,
          name: 'None'
        }
      ];

      CalendarConfigurationTabMainController.$onInit();

      expect(CalendarConfigurationTabMainController.publicRights).to.deep.equal(publicRightsExpected);
    });
  });

  describe('the openDeleteConfirmationDialog function', function() {
    it('should initialize self.modal', function() {
      expect(CalendarConfigurationTabMainController.modal).to.be.undefined;

      CalendarConfigurationTabMainController.openDeleteConfirmationDialog();

      expect(CalendarConfigurationTabMainController.modal).to.not.be.undefined;
    });
  });

  describe('the removeCalendar function', function() {
    it('should call calendarService.removeCalendar before $state to go back on the main view when deleting', function() {
      CalendarConfigurationTabMainController.calendar = {
        id: '123456789'
      };
      CalendarConfigurationTabMainController.calendarHomeId = '12345';

      CalendarConfigurationTabMainController.removeCalendar();

      expect($state.go).to.have.not.been.called;

      $rootScope.$digest();

      expect(calendarService.removeCalendar).to.have.been.calledWith(
        CalendarConfigurationTabMainController.calendarHomeId,
        CalendarConfigurationTabMainController.calendar
      );

      expect($state.go).to.have.been.calledWith('calendar.main');
    });
  });

  describe('the canDeleteCalendar function', function() {
    var canDeleteCalendarResult;

    beforeEach(function() {
      sinon.stub(calUIAuthorizationService, 'canDeleteCalendar', function() {
        return canDeleteCalendarResult;
      });
    });

    it('should return true if newCalendar=false and calUIAuthorizationService.canDeleteCalendar= true', function() {
      CalendarConfigurationTabMainController.newCalendar = false;
      canDeleteCalendarResult = true;

      expect(CalendarConfigurationTabMainController.canDeleteCalendar()).to.be.true;
    });

    it('should return false if newCalendar=false and calUIAuthorizationService.canDeleteCalendar= false', function() {
      CalendarConfigurationTabMainController.newCalendar = false;
      canDeleteCalendarResult = false;

      expect(CalendarConfigurationTabMainController.canDeleteCalendar()).to.be.false;
    });

    it('should return false if newCalendar=true', function() {
      CalendarConfigurationTabMainController.newCalendar = true;

      expect(CalendarConfigurationTabMainController.canDeleteCalendar()).to.be.false;
    });
  });

  describe('the canModifyPublicSelection', function() {
    it('should leverage calUIAuthorizationService.canModifyPublicSelection', function() {
      var canModifyPublicSelection = true;

      sinon.stub(calUIAuthorizationService, 'canModifyPublicSelection', function() {
        return canModifyPublicSelection;
      });
      CalendarConfigurationTabMainController.calendar = {
        id: 'id'
      };

      CalendarConfigurationTabMainController.$onInit();

      expect(calUIAuthorizationService.canModifyPublicSelection).to.have.been.calledWith(CalendarConfigurationTabMainController.calendar, session.user._id);
      expect(CalendarConfigurationTabMainController.canModifyPublicSelection).to.equal(canModifyPublicSelection);
    });

  });

  describe('the performSharedCalendarOperations', function() {
    var getShareeRightResult, getOwnerResult;

    beforeEach(function() {
      CalendarConfigurationTabMainController.externalCalendar = true;

      getShareeRightResult = CAL_CALENDAR_SHARED_RIGHT.SHAREE_ADMIN;
      getOwnerResult = {
        preferredEmail: 'preferredEmail'
      };

      CalendarConfigurationTabMainController.calendar = {
        rights: {
          getShareeRight: sinon.spy(function() {
            return getShareeRightResult;
          })
        },
        getOwner: sinon.spy(function() {
          return getOwnerResult;
        })
      };
    });

    it('should do nothing for a non external calendar', function() {
      sinon.stub(calUIAuthorizationService, 'canModifyPublicSelection', angular.noop);
      CalendarConfigurationTabMainController.externalCalendar = false;

      CalendarConfigurationTabMainController.$onInit();

      $rootScope.$digest();

      expect(CalendarConfigurationTabMainController.calendar.rights.getShareeRight).to.not.have.been.called;
      expect(CalendarConfigurationTabMainController.calendar.getOwner).to.not.have.been.called;
    });

    it('should call "calendar.rights.getShareeRight" with "session.user._id"', function() {
      CalendarConfigurationTabMainController.$onInit();

      $rootScope.$digest();

      expect(CalendarConfigurationTabMainController.calendar.rights.getShareeRight).to.have.been.calledWith(session.user._id);
      expect(CalendarConfigurationTabMainController.shareeRight).to.equal('Administration');
    });

    it('should set "shareeRight" depending on "calendar.rights.getShareeRight"', function() {
      var rightLabels = {};

      rightLabels[CAL_CALENDAR_SHARED_RIGHT.NONE] = 'None';
      rightLabels[CAL_CALENDAR_SHARED_RIGHT.SHAREE_READ] = 'Read only';
      rightLabels[CAL_CALENDAR_SHARED_RIGHT.SHAREE_READ_WRITE] = 'Read and Write';
      rightLabels[CAL_CALENDAR_SHARED_RIGHT.SHAREE_ADMIN] = 'Administration';
      rightLabels[CAL_CALENDAR_SHARED_RIGHT.SHAREE_FREE_BUSY] = 'Free/Busy';

      _.keys(rightLabels).forEach(function(sharedRight) {
        getShareeRightResult = sharedRight;
        CalendarConfigurationTabMainController.$onInit();

        $rootScope.$digest();

        expect(CalendarConfigurationTabMainController.calendar.rights.getShareeRight).to.have.been.calledWith(session.user._id);
        expect(CalendarConfigurationTabMainController.shareeRight).to.equal(rightLabels[sharedRight]);
      });
    });

    it('should call "getOwner" and set both of "sharedCalendarOwner" and "displayNameOfSharedCalendarOwner"', function() {
      var userUtilsResult = 'Firstname Lastname';
      sinon.stub(userUtils, 'displayNameOf', function() {
        return userUtilsResult;
      });

      CalendarConfigurationTabMainController.$onInit();

      $rootScope.$digest();

      expect(CalendarConfigurationTabMainController.calendar.getOwner).to.have.been.called;
      expect(userUtils.displayNameOf).to.have.been.called;
      expect(CalendarConfigurationTabMainController.sharedCalendarOwner).to.equal(getOwnerResult);
      expect(CalendarConfigurationTabMainController.displayNameOfSharedCalendarOwner).to.equal(userUtilsResult);
    });
  });
});
