'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The CalendarSharedConsultationController controller', function() {
  var $controller, $rootScope, $scope, $logMock, sharedCalendarOwner, sessionMock, CalendarSharedConsultationController, calendarHomeId, calendar, $stateParamsMock, calendarHomeServiceMock, calendarServiceMock, CAL_CALENDAR_SHARED_RIGHT;

  beforeEach(function() {
    $logMock = {
      error: sinon.spy(),
      info: sinon.spy(),
      debug: sinon.spy()
    };

    calendarHomeId = '123456789';

    sharedCalendarOwner = {
      firstname: 'calendarOwner'
    };

    calendar = {
      href: '/calendars/56095ccccbd51b7318ce6d0c/db0d5d63-c36a-42fc-9684-6f5e8132acfe.json',
      name: 'name',
      color: 'color',
      description: 'description',
      acl: 'acl',
      invite: 'invite',
      rights: {
        getShareeRight: sinon.spy(function(userId) {
          if (userId === 'adminId') {
            return;
          }

          return CAL_CALENDAR_SHARED_RIGHT.SHAREE_READ;
        }),
        getRightLabel: sinon.spy(function(userId) {
          if (userId === 'adminId') {
            return;
          }

          return 'Read only';
        }),
        _userEmails: {
          adminId: {}
        }
      },
      getOwner: function() {
        return sharedCalendarOwner;
      }
    };

    sessionMock = {
      user: {
        firstname: 'first',
        lastname: 'last',
        emails: ['user@test.com'],
        emailMap: { 'user@test.com': true }
      },
      ready: {
        then: function() {}
      }
    };

    calendarHomeServiceMock = {
      getUserCalendarHomeId: sinon.spy(function() {
        return $q.when(calendarHomeId);
      })
    };

    $stateParamsMock = {
      calendarId: '987654321'
    };

    calendarServiceMock = {
      getCalendar: sinon.spy(function() {
        return $q.when(calendar);
      }),
      listCalendars: sinon.spy(function() {
        return $q.when([]);
      })
    };

    angular.mock.module('esn.calendar');

    angular.mock.module(function($provide) {
      $provide.value('calendarHomeService', calendarHomeServiceMock);
      $provide.value('$stateParams', $stateParamsMock);
      $provide.value('calendarService', calendarServiceMock);
      $provide.value('session', sessionMock);
      $provide.value('$log', $logMock);
    });

    angular.mock.inject(function(_$controller_, _$rootScope_, _CAL_CALENDAR_SHARED_RIGHT_) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      CAL_CALENDAR_SHARED_RIGHT = _CAL_CALENDAR_SHARED_RIGHT_;
    });
  });

  beforeEach(function() {
    CalendarSharedConsultationController = $controller('CalendarSharedConsultationController', {$scope: $scope});
  });

  describe('the $onInit function', function() {
    it('should display an error message when the calendarId is missing', function() {
      delete $stateParamsMock.calendarId;

      CalendarSharedConsultationController.$onInit();

      expect($logMock.error).to.have.been.calledWith('the calendar ID is missing from the URL');
    });

    it('should get the calendarHomeId', function() {
      CalendarSharedConsultationController.$onInit();

      expect(calendarHomeServiceMock.getUserCalendarHomeId).to.be.called;
    });

    it('should call calendarService.getCalendar to get the calendar', function() {
      var options = {
        withRights: true
      };

      CalendarSharedConsultationController.$onInit();

      $rootScope.$digest();

      expect(calendarServiceMock.getCalendar).to.be.calledWith(calendarHomeId, $stateParamsMock.calendarId, options);
    });

    it('should initialize the calendar with the calendar returned by the calendarService.getCalendar', function() {
      CalendarSharedConsultationController.$onInit();

      $rootScope.$digest();

      expect(CalendarSharedConsultationController.sharedCalendar).to.deep.equal(calendar);
    });

    it('should initialize the user with the current user', function() {
      CalendarSharedConsultationController.$onInit();

      $rootScope.$digest();

      expect(CalendarSharedConsultationController.user).to.deep.equal(sessionMock.user);
    });

    it('should initialize the user Right with the user right from the shared calendar', function() {
      CalendarSharedConsultationController.$onInit();

      $rootScope.$digest();

      expect(CalendarSharedConsultationController.userRightLabel).to.be.equal('Read only');
    });

    it('should get the calendarOwner from the shared calendar', function() {
      CalendarSharedConsultationController.$onInit();

      $rootScope.$digest();

      expect(CalendarSharedConsultationController.sharedCalendarOwner).to.deep.equal(sharedCalendarOwner);
    });
  });
});
