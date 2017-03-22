'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The CalendarSharedConsultController controller', function() {
  var $controller, $rootScope, $scope, calendarAdmin, sessionMock, CalendarSharedConsultController, calendarHomeId, calendar, $stateParamsMock, calendarHomeServiceMock, calendarServiceMock, userAPIMock, CALENDAR_RIGHT, CALENDAR_SHARED_RIGHT;

  beforeEach(function() {
    calendarHomeId = '123456789';

    calendar = {
      href: '/calendars/56095ccccbd51b7318ce6d0c/db0d5d63-c36a-42fc-9684-6f5e8132acfe.json',
      name: 'name',
      color: 'color',
      description: 'description',
      acl: 'acl',
      invite: 'invite',
      rights: {
        getUserRight: sinon.spy(function(userId) {
          if (userId === 'adminId') {
            return CALENDAR_RIGHT.ADMIN;
          }

          return CALENDAR_RIGHT.SHAREE_READ;
        }),
        getShareeRight: sinon.spy(function(userId) {
          if (userId === 'adminId') {
            return;
          }

          return CALENDAR_SHARED_RIGHT.SHAREE_READ;
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

    calendarAdmin = {
      _id: 'adminId',
      firsname: 'admin',
      lastname: 'admin'
    };

    userAPIMock = {
      user: function(userId) {
        if (userId === 'adminId') {
          return $q.when({
            data: calendarAdmin
          });
        }

        return $q.when({});
      }
    };

    angular.mock.module('esn.calendar');

    angular.mock.module(function($provide) {
      $provide.value('calendarHomeService', calendarHomeServiceMock);
      $provide.value('$stateParams', $stateParamsMock);
      $provide.value('calendarService', calendarServiceMock);
      $provide.value('userAPI', userAPIMock);
      $provide.value('session', sessionMock);
    });

    angular.mock.inject(function(_$controller_, _$rootScope_, _CALENDAR_RIGHT_, _CALENDAR_SHARED_RIGHT_) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      CALENDAR_RIGHT = _CALENDAR_RIGHT_;
      CALENDAR_SHARED_RIGHT = _CALENDAR_SHARED_RIGHT_;
    });
  });

  beforeEach(function() {
    CalendarSharedConsultController = $controller('CalendarSharedConsultController', {$scope: $scope});
  });

  describe('the $onInit function', function() {
    it('should get the calendarHomeId', function() {
      CalendarSharedConsultController.$onInit();

      expect(calendarHomeServiceMock.getUserCalendarHomeId).to.be.called;
    });

    it('should call calendarService.getCalendar to get the calendar', function() {
      var options = {
        withRights: true
      };

      CalendarSharedConsultController.$onInit();

      $rootScope.$digest();

      expect(calendarServiceMock.getCalendar).to.be.calledWith(calendarHomeId, $stateParamsMock.calendarId, options);
    });

    it('should initialize the calendar with the calendar returned by the calendarService.getCalendar', function() {
      CalendarSharedConsultController.$onInit();

      $rootScope.$digest();

      expect(CalendarSharedConsultController.calendar).to.deep.equal(calendar);
    });

    it('should initialize the user with the current user', function() {
      CalendarSharedConsultController.$onInit();

      $rootScope.$digest();

      expect(CalendarSharedConsultController.user).to.deep.equal(sessionMock.user);
    });

    it('should initialize the user Right with the user right from the shared calendar', function() {
      CalendarSharedConsultController.$onInit();

      $rootScope.$digest();

      expect(CalendarSharedConsultController.userRightLabel).to.be.equal('Read only');
    });

    it('should get the calendarOwner from the shared calendar', function() {
      CalendarSharedConsultController.$onInit();

      $rootScope.$digest();

      expect(CalendarSharedConsultController.calendarOwner).to.deep.equal(calendarAdmin);
    });
  });
});
