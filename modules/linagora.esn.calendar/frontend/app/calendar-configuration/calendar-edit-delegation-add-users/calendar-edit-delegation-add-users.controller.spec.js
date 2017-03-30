'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The CalendarEditDelegationAddUsersController controller', function() {
  var stateParamsMock, CALENDAR_SHARED_RIGHT, CalendarEditDelegationAddUsersController, $rootScope, $scope, $controller;

  beforeEach(function() {
    stateParamsMock = {
      newUsersGroups: ['user1', 'user2'],
      delegationTypes: ['none', 'read', 'write']
    };

    angular.mock.module('esn.calendar');

    angular.mock.module(function($provide) {
      $provide.value('$stateParams', stateParamsMock);
    });

    angular.mock.inject(function(_$controller_, _$rootScope_, _CALENDAR_SHARED_RIGHT_) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      CALENDAR_SHARED_RIGHT = _CALENDAR_SHARED_RIGHT_;
    });
  });

  beforeEach(function() {
    CalendarEditDelegationAddUsersController = $controller('CalendarEditDelegationAddUsersController', { $scope: $scope });
  });

  describe('the $onInit function', function() {

    it('should initialize newUsersGroups', function() {
      CalendarEditDelegationAddUsersController.$onInit();

      expect(CalendarEditDelegationAddUsersController.newUsersGroups).to.be.deep.equal(stateParamsMock.newUsersGroups);
    });

    it('should initialize newUsersGroups', function() {
      CalendarEditDelegationAddUsersController.$onInit();

      expect(CalendarEditDelegationAddUsersController.delegationTypes).to.be.deep.equal(stateParamsMock.delegationTypes);
    });

    it('should initialize newUsersGroups', function() {
      CalendarEditDelegationAddUsersController.$onInit();

      expect(CalendarEditDelegationAddUsersController.selectedShareeRight).to.be.deep.equal(CALENDAR_SHARED_RIGHT.NONE);
    });
  });
});
