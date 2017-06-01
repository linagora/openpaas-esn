'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The CalendarsListItemController controller', function() {
  var $controller, $rootScope, userUtils, calendar;

  beforeEach(function() {
    userUtils = {
      displayNameOf: sinon.spy()
    };
    calendar = {
      getOwner: sinon.spy()
    };

    angular.mock.module('esn.calendar');

    angular.mock.module(function($provide) {
      $provide.value('userUtils', userUtils);
    });

    angular.mock.inject(function(_$controller_, _$rootScope_) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
    });
  });

  function initController() {
    return $controller('CalendarsListItemController');
  }

  describe('The $onInit function', function() {
    it('should set the ctrl.ownerDisplayName property when ctrl.showDetails is truely', function() {
      var displayName = 'The user display name';
      var owner = {_id: 1};
      var controller = initController();

      calendar.getOwner = sinon.spy(function() {
        return $q.when(owner);
      });
      userUtils.displayNameOf = sinon.spy(function() {
        return displayName;
      });

      controller.showDetails = true;
      controller.calendar = calendar;
      controller.$onInit();
      $rootScope.$digest();

      expect(calendar.getOwner).to.have.been.calledOnce;
      expect(userUtils.displayNameOf).to.have.been.calledWith(owner);
      expect(controller.ownerDisplayName).to.equal(displayName);
    });

    it('should not set the ctrl.ownerDisplayName property when ctrl.showDetails is falsy', function() {
      var displayName = 'The user display name';
      var controller = initController();

      calendar.getOwner = sinon.spy(function() {
        return $q.when();
      });
      userUtils.displayNameOf = sinon.spy(function() {
        return displayName;
      });

      controller.calendar = calendar;
      controller.$onInit();
      $rootScope.$digest();

      expect(calendar.getOwner).to.not.have.been.called;
      expect(userUtils.displayNameOf).to.not.have.been.called;
      expect(controller.ownerDisplayName).to.not.be.defined;
    });
  });
});
