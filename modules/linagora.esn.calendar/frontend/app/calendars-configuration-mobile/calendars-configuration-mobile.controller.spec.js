'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The CalCalendarsConfigurationMobileController controller', function() {
  var $controller, $rootScope, $scope, $state, calendarHomeService, calPublicCalendarStore, calendarService,
    userAndExternalCalendarsMock;

  beforeEach(function() {
    calendarHomeService = {
      getUserCalendarHomeId: sinon.spy(function() {
        return $q.when('123');
      })
    };

    calPublicCalendarStore = {
      getAll: sinon.stub().returns(
        []
      )
    };

    calendarService = {
      listCalendars: sinon.stub().returns(
        []
      )
    };

    $state = {
      go: sinon.spy()
    };

    angular.mock.module('esn.calendar', function($provide) {
      $provide.value('calendarHomeService', calendarHomeService);
      $provide.value('calPublicCalendarStore', calPublicCalendarStore);
      $provide.value('calendarService', calendarService);
      $provide.value('$state', $state);
      $provide.value('userAndExternalCalendars', function() {
        return userAndExternalCalendarsMock();
      });
    });

    angular.mock.inject(function(_$controller_, _$rootScope_, _$state_, _calendarHomeService_, _calPublicCalendarStore_, _calendarService_) {
        $controller = _$controller_;
        $rootScope = _$rootScope_;
        $scope = $rootScope.$new();
        $state = _$state_;
        calendarService = _calendarService_;
        calendarHomeService = _calendarHomeService_;
        calPublicCalendarStore = _calPublicCalendarStore_;
      }
    );
  });

  function initController() {
    return $controller('CalCalendarsConfigurationMobileController', { $scope: $scope });
  }

  describe('the CalendarsConfigurationMobileController initialization', function() {
    it('should retrieve calendarHomeId', function(done) {

      userAndExternalCalendarsMock = function() {
        expect(calendarHomeService.getUserCalendarHomeId).to.have.been.called;
        expect(calendarService.listCalendars).to.have.been.calledWith('123');
        expect(calPublicCalendarStore.getAll).to.have.been.calledWith;

        done();
      };

      initController().$onInit();

      $scope.$digest();
    });
  });

  describe('the goToSharedCalendarConfiguration function', function() {
    var calendar, controller;
    beforeEach(function() {
      calendar = {
        uniqueId: '123',
        isShared: sinon.stub().returns(true)
      };

      controller = initController();
    });

    it('should go to calendar.external.shared if calendar is a shared by another user', function() {
      calendar.isShared = sinon.stub().returns(true);

      controller.goToSharedCalendarConfiguration(calendar);

      expect($state.go).to.have.been.calledWith('calendar.external.shared', { calendarUniqueId: calendar.uniqueId });
    });

    it('should go to calendar.external.public if calendar is a shared by another user', function() {
      calendar.isShared = sinon.stub().returns(false);

      controller.goToSharedCalendarConfiguration(calendar);

      expect($state.go).to.have.been.calledWith('calendar.external.public', { calendarUniqueId: calendar.uniqueId });
    });
  });
});
