'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The profileController', function() {
  var $rootScope;
  var $controller;
  var userMock;
  var $scope;
  var profileHelpersService;

  beforeEach(function() {
    angular.mock.module('linagora.esn.profile');

    inject(function(_$rootScope_, _$controller_, _profileHelpersService_) {
      $rootScope = _$rootScope_;
      $controller = _$controller_;
      profileHelpersService = _profileHelpersService_;
    });
  });

  beforeEach(function() {
    userMock = {
      _id: '123'
    };
  });

  function initController(scope) {
    $scope = scope || $rootScope.$new();

    var controller = $controller('profileShowDetailsController', { $scope: $scope }, { user: userMock });

    controller.$onInit();
    $scope.$digest();

    return controller;
  }

  it('should set canEdit to true on init controller if the current user has permission', function() {
    profileHelpersService.canEdit = sinon.stub().returns(true);
    var controller = initController();

    expect(controller.canEdit).to.be.true;
    expect(profileHelpersService.canEdit).to.have.been.calledWith(userMock);
  });
});
