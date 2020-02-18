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
    $scope = $rootScope.$new();
  });

  function initProfileController(scope) {
    $scope = scope || $scope;

    return $controller('profileController', {
      $scope: $scope,
      user: userMock
    });
  }

  it('should set "me" true if the target user is current user', function() {
    profileHelpersService.isMe = sinon.stub().returns(true);
    initProfileController();

    expect($scope.me).to.be.true;
    expect(profileHelpersService.isMe).to.have.been.calledWith(userMock);
  });

  it('should set "me" false if the target user is not current user', function() {
    profileHelpersService.isMe = sinon.stub().returns(false);
    initProfileController();

    expect($scope.me).to.be.false;
    expect(profileHelpersService.isMe).to.have.been.calledWith(userMock);
  });

  it('should set "canEdit" true if the current user can edit the target user', function() {
    profileHelpersService.canEdit = sinon.stub().returns(true);
    initProfileController();

    expect($scope.canEdit).to.be.true;
    expect(profileHelpersService.canEdit).to.have.been.calledWith(userMock);
  });

  it('should set "canEdit" true if the current user cannot edit the target user', function() {
    profileHelpersService.canEdit = sinon.stub().returns(false);
    initProfileController();

    expect($scope.canEdit).to.be.false;
    expect(profileHelpersService.canEdit).to.have.been.calledWith(userMock);
  });
});
