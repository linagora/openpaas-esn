'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The CalendarConfigurationTabsController controller', function() {
  var CalendarConfigurationTabsController, calUIAuthorizationService, $rootScope, $scope, $controller, session;

  beforeEach(function() {
    angular.mock.module('esn.calendar');

    angular.mock.inject(function(_$controller_, _$rootScope_, _calUIAuthorizationService_, _session_) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      calUIAuthorizationService = _calUIAuthorizationService_;
      session = _session_;
    });
  });

  beforeEach(function() {
    CalendarConfigurationTabsController = $controller('CalendarConfigurationTabsController', { $scope: $scope });
  });

  describe('the canShowDelegationTab function', function() {
    var calUIAuthorizationServiceCanShowDelegationTabResult;

    beforeEach(function() {
      sinon.stub(calUIAuthorizationService, 'canShowDelegationTab', function() {
        return calUIAuthorizationServiceCanShowDelegationTabResult;
      });
    });

    it('should return false if newCalendar=true', function() {
      CalendarConfigurationTabsController.newCalendar = true;

      expect(CalendarConfigurationTabsController.canShowDelegationTab()).to.be.false;
    });

    it('should return false if newCalendar=false and calUIAuthorizationService.canShowDelegationTab is false', function() {
      calUIAuthorizationServiceCanShowDelegationTabResult = false;
      CalendarConfigurationTabsController.newCalendar = false;
      CalendarConfigurationTabsController.calendar = {
        id: 'id'
      };

      expect(CalendarConfigurationTabsController.canShowDelegationTab()).to.be.false;
      expect(calUIAuthorizationService.canShowDelegationTab).to.have.been.calledWith(CalendarConfigurationTabsController.calendar, session.user._id);
    });

    it('should return true if newCalendar=false and calUIAuthorizationService.canShowDelegationTab is true', function() {
      calUIAuthorizationServiceCanShowDelegationTabResult = true;
      CalendarConfigurationTabsController.newCalendar = false;
      CalendarConfigurationTabsController.calendar = {
        id: 'id'
      };

      expect(CalendarConfigurationTabsController.canShowDelegationTab()).to.be.true;
      expect(calUIAuthorizationService.canShowDelegationTab).to.have.been.calledWith(CalendarConfigurationTabsController.calendar, session.user._id);
    });
  });
});
