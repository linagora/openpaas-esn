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
    sessionMock = { user: userMock };
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

  it('should set a me flag when the user is the same as the logged-in user', function() {
    initProfileController();

    expect($scope.me).to.be.true;
  });

  it('should not set a me flag when the user is not the logged-in user', function() {
    sessionMock.user = {
      _id: '456'
    };

    initProfileController();

    expect($scope.me).to.be.false;
  });
});
