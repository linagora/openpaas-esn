'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The calendar configuration tab delegation controller', function() {
  var $rootScope,
    $controller,
    $scope,
    $state,
    $q,
    CalendarConfigurationTabMainController,
    calendarService,
    CAL_CALENDAR_RIGHT;

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

    angular.mock.inject(function(_$rootScope_, _$controller_, _$state_, _$q_, _CAL_CALENDAR_RIGHT_) {
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $controller = _$controller_;
      $state = _$state_;
      $q = _$q_;
      CAL_CALENDAR_RIGHT = _CAL_CALENDAR_RIGHT_;
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
          value: CAL_CALENDAR_RIGHT.PUBLIC_READ,
          name: 'Read'
        },
        {
          value: CAL_CALENDAR_RIGHT.WRITE,
          name: 'Write'
        }, {
          value: CAL_CALENDAR_RIGHT.FREE_BUSY,
          name: 'Private'
        }, {
          value: CAL_CALENDAR_RIGHT.NONE,
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
    it('should return true if isDefaultCalendar=false and newCalendar=false', function() {
      CalendarConfigurationTabMainController.isDefaultCalendar = false;
      CalendarConfigurationTabMainController.newCalendar = false;

      expect(CalendarConfigurationTabMainController.canDeleteCalendar()).to.be.true;
    });

    it('should return false if isDefaultCalendar=true and newCalendar=true', function() {
      CalendarConfigurationTabMainController.isDefaultCalendar = true;
      CalendarConfigurationTabMainController.newCalendar = true;

      expect(CalendarConfigurationTabMainController.canDeleteCalendar()).to.be.false;
    });

    it('should return false if isDefaultCalendar=false and newCalendar=true', function() {
      CalendarConfigurationTabMainController.isDefaultCalendar = false;
      CalendarConfigurationTabMainController.newCalendar = true;

      expect(CalendarConfigurationTabMainController.canDeleteCalendar()).to.be.false;
    });

    it('should return false if isDefaultCalendar=true and newCalendar=false', function() {
      CalendarConfigurationTabMainController.isDefaultCalendar = false;
      CalendarConfigurationTabMainController.newCalendar = true;

      expect(CalendarConfigurationTabMainController.canDeleteCalendar()).to.be.false;
    });
  });
});
