'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The userStatusBubbleController controller', function() {

  var $rootScope, $scope, $controller, userStatusService, userId, USER_STATUS_EVENTS, USER_STATUS;

  beforeEach(function() {
    userId = 1;
    userStatusService = {};

    angular.mock.module('linagora.esn.user-status', function($provide) {
      $provide.value('userStatusService', userStatusService);
      $provide.value('session', {ready: {then: function() {}}});
    });

    angular.mock.inject(function(_$rootScope_, _$controller_, _USER_STATUS_EVENTS_, _USER_STATUS_) {
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $controller = _$controller_;
      USER_STATUS_EVENTS = _USER_STATUS_EVENTS_;
      USER_STATUS = _USER_STATUS_;
    });
  });

  function initController() {
    var controller = $controller('userStatusBubbleController',
      {$scope: $scope},
      {userId: userId}
    );

    $scope.$digest();

    return controller;
  }

  describe('The $onInit function', function() {

    it('should get the status from userStatusService', function() {
      var status = USER_STATUS.connected;

      userStatusService.getCurrentStatus = sinon.spy(function() {
        return $q.when({_id: userId, status: status});
      });
      var controller = initController();

      controller.$onInit();
      $rootScope.$digest();
      expect(userStatusService.getCurrentStatus).to.have.been.calledWith(userId);
      expect(controller.status).to.equal(status);
    });

    it('should set disconnect status when userStatusService fails', function() {
      var controller = initController();

      userStatusService.getCurrentStatus = sinon.spy(function() {
        return $q.reject(new Error());
      });

      controller.$onInit();
      $rootScope.$digest();
      expect(userStatusService.getCurrentStatus).to.have.been.calledWith(userId);
      expect(controller.status).to.equal(USER_STATUS.unknown);
    });
  });

  describe('on $scope USER_STATUS_EVENTS.USER_CHANGE_STATE event', function() {

    beforeEach(function() {
      userStatusService.getCurrentStatus = function() {
        return $q.when({_id: userId, status: USER_STATUS.connected});
      };
    });

    it('should update the status if event._id is the current user', function() {
      var status = 'updatedstatus';
      var event = {};
      var controller = initController();

      controller.$onInit();
      $rootScope.$digest();

      event[userId] = {status: status};
      $scope.$emit(USER_STATUS_EVENTS.USER_CHANGE_STATE, event);
      $rootScope.$digest();
      expect(controller.status).to.equal(status);
    });

    it('should ignore status if event._id is not the current user', function() {
      var status = 'updatedstatus';
      var event = {anotherUserId: {status: status}};
      var controller = initController();

      controller.$onInit();
      $rootScope.$digest();

      $scope.$emit(USER_STATUS_EVENTS.USER_CHANGE_STATE, event);
      $rootScope.$digest();
      expect(controller.status).to.not.equal(status);
    });
  });
});
