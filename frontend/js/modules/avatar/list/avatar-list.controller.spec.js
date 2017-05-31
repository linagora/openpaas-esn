'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The ESNAvatarListController', function() {
  var $controller, $scope, $rootScope, members;

  function addMember(numberOfMembers) {
    members = [];
    for (var i = 0; i < numberOfMembers; i++) {
      members.push({member: { id: i + 1 }});
    }

    return members;
  }

  function initController(members) {
    var controller = $controller('ESNAvatarListController',
      {$scope: $scope},
      {members: members}
    );

    controller.limit = 5;
    $scope.$digest();

    return controller;
  }

  beforeEach(function() {
    members = addMember(7);

    angular.mock.module('esn.avatar');
  });

  beforeEach(inject(function(_$controller_, _$q_, _$rootScope_) {
    $controller = _$controller_;
    $rootScope = _$rootScope_;
    $scope = $rootScope.$new();
  }));

  describe('the $onInit function', function() {

    it('should set the profile link to default value when it is undefined', function() {
      var controller = initController(members);

      controller.$onInit();

      expect(controller.profileLink).to.be.equal('profile({user_id: member.id})');
    });
  });

  describe('the isLimitedDisplay function', function() {

    it('should return true when limit is equal to the defaultLimit', function() {
      var controller = initController(members);

      controller.$onInit();

      expect(controller.isLimitedDisplay()).to.be.true;
    });

    it('should return false when switchDisplay is called once', function() {
      var controller = initController(members);

      controller.$onInit();
      controller.switchDisplay();

      expect(controller.isLimitedDisplay()).to.be.false;
    });

    it('should return true when switchDisplay is called twice', function() {
      var controller = initController(members);

      controller.$onInit();
      controller.switchDisplay();
      controller.switchDisplay();

      expect(controller.isLimitedDisplay()).to.be.true;
    });
  });

  describe('the canShowButton function', function() {

    it('should return true when members length is upper than defaultLimit ', function() {
      var controller = initController(members);

      controller.$onInit();

      expect(controller.canShowButton()).to.be.true;
    });

    it('should return false when members length is lower than defaultLimit ', function() {
      var members = addMember(2);
      var controller = initController(members);

      controller.$onInit();

      expect(controller.canShowButton()).to.be.false;
    });
  });

  describe('the switchDisplay function', function() {

    it('should set limit to members length if isLimitedDisplay is true', function() {
      var controller = initController(members);

      controller.$onInit();
      controller.switchDisplay();

      expect(controller.limit).to.equal(7);
    });

    it('should set limit to its initial value if isLimitedDisplay is false', function() {
      var controller = initController(members);

      controller.$onInit();
      controller.switchDisplay();
      controller.switchDisplay();

      expect(controller.limit).to.equal(5);
    });
  });
});
