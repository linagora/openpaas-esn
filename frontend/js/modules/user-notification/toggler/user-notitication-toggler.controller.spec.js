'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The EsnUserNotificationTogglerController controller', function() {
  var $controller, $scope, $state, matchmedia, $rootScope, popover, ESN_MEDIA_QUERY_SM_XS;
  var esnUserNotificationState;

  function initController() {
    var controller = $controller('EsnUserNotificationTogglerController', {$scope: $scope});

    $scope.$digest();

    return controller;
  }

  beforeEach(function() {
    popover = {
      toggle: sinon.spy()
    };

    matchmedia = {
      is: sinon.spy()
    };

    $state = {
      go: sinon.spy()
    };
  });

  beforeEach(function() {
    angular.mock.module('esn.user-notification', function($provide) {
      $provide.constant('matchmedia', matchmedia);
      $provide.constant('$state', $state);
    });
  });

  beforeEach(inject(function(
    _$controller_,
    _$q_,
    _$rootScope_,
    _$state_,
    _esnUserNotificationState_,
    _ESN_MEDIA_QUERY_SM_XS_
  ) {
    $controller = _$controller_;
    $rootScope = _$rootScope_;
    $state = _$state_;
    esnUserNotificationState = _esnUserNotificationState_;
    ESN_MEDIA_QUERY_SM_XS = _ESN_MEDIA_QUERY_SM_XS_;
    $scope = $rootScope.$new();
    $scope.popover = popover;
  }));

  describe('The open function', function() {
    beforeEach(function() {
      initController();
    });

    it('should toggle the popover on desktop', function() {
      matchmedia.is = sinon.spy(function() {
        return false;
      });

      $scope.open();

      expect(matchmedia.is).to.have.been.calledWith(ESN_MEDIA_QUERY_SM_XS);
      expect(popover.toggle).to.have.been.calledOnce;
      expect($state.go).to.not.have.been.called;
    });

    it('should open the notification page on mobile', function() {
      matchmedia.is = sinon.spy(function() {
        return true;
      });

      $scope.open();

      expect(matchmedia.is).to.have.been.calledWith(ESN_MEDIA_QUERY_SM_XS);
      expect(popover.toggle).to.not.have.been.called;
      expect($state.go).to.have.been.calledWith('user-notification.list');
    });
  });

  describe('The getNumberOfNotifications function', function() {
    it('should call esnUserNotificationState.getCount function to get number of notifications', function() {
      var count = 10;

      esnUserNotificationState.getCount = sinon.stub().returns(count);
      initController();

      var numberOfNotifications = $scope.getNumberOfNotifications();

      expect(esnUserNotificationState.getCount).to.have.been.calledOnce;
      expect(numberOfNotifications).to.equal(count);
    });
  });

  describe('The hasImportantNotifications function', function() {
    it('should return false if there is no important notification', function() {
      esnUserNotificationState.getNumberOfImportantNotifications = sinon.stub().returns(0);
      initController();

      var hasImportantNotifications = $scope.hasImportantNotifications();

      expect(esnUserNotificationState.getNumberOfImportantNotifications).to.have.been.calledOnce;
      expect(hasImportantNotifications).to.equal(false);
    });

    it('should return true if there are important notifications', function() {
      esnUserNotificationState.getNumberOfImportantNotifications = sinon.stub().returns(10);
      initController();

      var hasImportantNotifications = $scope.hasImportantNotifications();

      expect(esnUserNotificationState.getNumberOfImportantNotifications).to.have.been.calledOnce;
      expect(hasImportantNotifications).to.equal(true);
    });
  });
});
