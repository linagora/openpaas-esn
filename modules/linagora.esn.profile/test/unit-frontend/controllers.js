'use strict';

/* global chai: false */
/* global sinon: true */

var expect = chai.expect;

describe('The linagora.esn.profile Angular module controllers', function() {

  var $rootScope;
  var $controller;
  var $state;
  var $httpBackend;

  var profileAPI;

  beforeEach(function() {
    angular.mock.module('linagora.esn.profile');

    inject(function(_$rootScope_, _$controller_, _$state_, _$httpBackend_, _profileAPI_) {
      $rootScope = _$rootScope_;
      $controller = _$controller_;
      $state = _$state_;
      $httpBackend = _$httpBackend_;

      profileAPI = _profileAPI_;
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
  });

  describe('The profileEditionController', function() {
    var userMock;
    var profileAPIMock;
    var sessionMock;
    var $scope;
    var context;

    beforeEach(function() {
      userMock = {
        name: 'Foo',
        address: 'foo@bar.com',
        _id: '123'
      };
      profileAPIMock = {};
      sessionMock = { user: userMock };
      sessionMock.setUser = sinon.spy(function(user) {
        sessionMock.user = user;
      });
      $scope = $rootScope.$new();
    });

    function initProfileEditionController(scope, profileAPINotMocked) {
      $scope = scope || $scope;

      context = {
        $scope: $scope,
        user: userMock,
        session: sessionMock
      };

      context.profileAPI = profileAPINotMocked ? profileAPI : profileAPIMock;

      return $controller('profileEditionController', context);
    }

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

      initProfileEditionController();

      profileAPIMock.updateProfile = function(user) {
        expect(user).to.equal(profile);
        done();
      };
      $scope.updateProfile(profile);
    });

    it('should update user in session when updating profile', function(done) {
      var profile = {
        firstname: 'john',
        lastname: 'smith',
        main_phone: '55555'
      };

      var profileAPINotMocked = true;

      $state.reload = sinon.spy();

      initProfileEditionController(null, profileAPINotMocked);

      $httpBackend.expectPUT('/api/user/profile', profile).respond(200);

      $scope.updateProfile(profile).then(function() {
        expect(sessionMock.user).to.equal(profile);
        expect(sessionMock.setUser).to.have.been.calledWith(profile);
        expect($state.reload).to.have.been.called;

        done();
      });

      $httpBackend.flush();
    });
  });

  describe('The profileOverviewController', function() {

    var sessionMock;
    var sameUser;
    var differentUser;

    beforeEach(function() {
      sessionMock = { user: {_id: '123'} };
      sameUser = {
        _id: '123'
      };
      differentUser = {
        _id: '456'
      };
    });

    function initProfileOverviewController(userMock) {

      return $controller('profileOverviewController', {session: sessionMock}, {user: userMock});
    }

    it('should set a me flag when the user is the same as the logged-in user', function() {
      var ctrl = initProfileOverviewController(sameUser);

      expect(ctrl.me).to.be.true;
    });

    it('should not set a me flag when the user is not the logged-in user', function() {
      var ctrl = initProfileOverviewController(differentUser);

      expect(ctrl.me).to.be.false;
    });
  });
});
