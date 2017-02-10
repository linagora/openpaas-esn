'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The linagora.esn.profile Angular module controllers', function() {

  var $rootScope;
  var $controller;
  var $state;
  var esnPreviousState;

  beforeEach(function() {
    angular.mock.module('linagora.esn.profile');

    inject(function(_$rootScope_, _$controller_, _$state_, _esnPreviousState_) {
      $rootScope = _$rootScope_;
      $controller = _$controller_;
      $state = _$state_;
      esnPreviousState = _esnPreviousState_;
    });
  });

  describe('The profileController', function() {

    var userMock;
    var profileAPIMock;
    var sessionMock;
    var $scope;

    beforeEach(function() {
      userMock = {
        name: 'Foo',
        address: 'foo@bar.com',
        _id: '123'
      };
      profileAPIMock = {};
      sessionMock = { user: userMock };
      $scope = $rootScope.$new();
    });

    function initProfileController(scope) {
      $scope = scope || $scope;

      return $controller('profileController', {
        $scope: $scope,
        $state: $state,
        profileAPI: profileAPIMock,
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

    it('should set previous state on the state which is not nested in profile state', function() {
      var otherState = 'dummies';
      var from = {
        name: otherState
      };

      initProfileController();

      esnPreviousState.set = sinon.spy();

      $state.go('profile.details.view');
      $scope.$broadcast('$stateChangeSuccess', null, null, from);
      expect(esnPreviousState.set).to.have.been.called;
    });

    it('should not set previous state on the state which is nested in profile state', function() {
      var otherState = 'profile.details.dummies';
      var from = {
        name: otherState
      };

      initProfileController();

      esnPreviousState.set = sinon.spy();

      $state.go('profile.details.view');
      $scope.$broadcast('$stateChangeSuccess', null, null, from);
      expect(esnPreviousState.set).to.not.have.been.called;
    });

    describe('The back method', function() {

      it('should go to previous eligible state', function() {
        initProfileController();
        esnPreviousState.go = sinon.spy();
        $scope.back();

        expect(esnPreviousState.go).to.have.been.calledWith('home');
      });
    });
  });

  describe('The profileEditionController', function() {
    var userMock;
    var profileAPIMock;
    var sessionMock;
    var $scope;

    beforeEach(function() {
      userMock = {
        name: 'Foo',
        address: 'foo@bar.com',
        _id: '123'
      };
      profileAPIMock = {};
      sessionMock = { user: userMock };
      $scope = $rootScope.$new();
    });

    function initProfileEditionController(scope) {
      $scope = scope || $scope;

      return $controller('profileEditionController', {
        $scope: $scope,
        profileAPI: profileAPIMock,
        user: userMock,
        session: sessionMock
      });
    }
    beforeEach(function() {
      initProfileEditionController();
    });

    var getMoreThan100CharString = function() {
      return new Array(1000).join('a');
    };

    it('should call the profileAPI.updateProfile() method if we would like to update profile and should not display error if profile attributes are too long', function(done) {
      var profile = {
        firstname: getMoreThan100CharString(),
        lastname: getMoreThan100CharString(),
        job_title: getMoreThan100CharString(),
        service: getMoreThan100CharString(),
        building_location: getMoreThan100CharString(),
        office_location: getMoreThan100CharString(),
        main_phone: getMoreThan100CharString(),
        description: getMoreThan100CharString()
      };
      profileAPIMock.updateProfile = function(user) {
        expect(user).to.equal(profile);
        done();
      };
      $scope.updateProfile(profile);
    });
  });
});
