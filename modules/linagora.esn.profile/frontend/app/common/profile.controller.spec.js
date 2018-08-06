'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The profileController', function() {
  var $rootScope;
  var $controller;
  var userMock;
  var sessionMock;
  var $scope;

  beforeEach(function() {
    angular.mock.module('linagora.esn.profile');

    inject(function(_$rootScope_, _$controller_) {
      $rootScope = _$rootScope_;
      $controller = _$controller_;
    });
  });

  beforeEach(function() {
    userMock = {
      name: 'Foo',
      address: 'foo@bar.com',
      _id: '123'
    };
    sessionMock = { user: userMock, userIsDomainAdministrator: angular.noop };
    $scope = $rootScope.$new();
  });

  function initProfileController(scope) {
    $scope = scope || $scope;

    return $controller('profileController', {
      $scope: $scope,
      user: userMock,
      session: sessionMock
    });
  }

  it('should set "me" and "canEdit" true for current user', function() {
    initProfileController();

    expect($scope.me).to.be.true;
    expect($scope.canEdit).to.be.true;
  });

  it('should set "me" and "canEdit" false for another user who is not domain admin', function() {
    sessionMock = {
      user: {
        _id: '456'
      },
      userIsDomainAdministrator: function() { return false; }
    };

    initProfileController();

    expect($scope.me).to.be.false;
    expect($scope.canEdit).to.be.false;
  });

  it('should set "canEdit" true for domain admin user', function() {
    sessionMock = {
      user: {
        _id: '456'
      },
      userIsDomainAdministrator: function() { return true; }
    };

    initProfileController();

    expect($scope.me).to.be.false;
    expect($scope.canEdit).to.be.true;
  });
});
