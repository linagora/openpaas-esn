'use strict';

/* global chai: false */

var expect = chai.expect;

describe('userAPI service', function() {
  var $httpBackend, userAPI;

  beforeEach(function() {
    module('esn.user');

    inject(function(_$httpBackend_, _userAPI_) {
      $httpBackend = _$httpBackend_;
      userAPI = _userAPI_;
    });
  });

  describe('user(:uuid) method', function() {
    it('should send a request to /api/users/:uuid', function() {
      var uuid = 123456789;

      $httpBackend.expectGET('/api/users/' + uuid).respond(this.response);
      userAPI.user(uuid);
      $httpBackend.flush();
    });

    it('should return a promise', function() {
      var promise = userAPI.user(123456789);

      expect(promise.then).to.be.a.function;
    });
  });

  describe('currentUser() method', function() {
    it('should send a request to /api/user', function() {
      $httpBackend.expectGET(/\/api\/user\?_=[0-9]+$/).respond(this.response);
      userAPI.currentUser();
      $httpBackend.flush();
    });

    it('should return a promise', function() {
      var promise = userAPI.currentUser();

      expect(promise.then).to.be.a.function;
    });
  });

  describe('The setUserStates method', function() {
    it('should send a request to /api/users', function() {
      var domainId = 456;
      var userId = 123;
      var states = [{ name: 'login', value: 'disabled' }];

      $httpBackend.expectPUT('/api/users/' + userId + '/states?domain_id=' + domainId, states).respond(this.response);
      userAPI.setUserStates(userId, states, domainId);
      $httpBackend.flush();
    });
  });

  describe('getCommunities() method', function() {
    beforeEach(angular.mock.inject(function(_userAPI_, _$httpBackend_, _Restangular_) {
      $httpBackend = _$httpBackend_;
      userAPI = _userAPI_;
      _Restangular_.setFullResponse(true);
    }));

    it('should send a GET request to /api/user/communities', function() {
      $httpBackend.expectGET('/api/user/communities').respond(200, []);
      userAPI.getCommunities();
      $httpBackend.flush();
    });

    it('should return a promise', function() {
      var promise = userAPI.getCommunities();

      expect(promise.then).to.be.a.function;
    });
  });

  describe('getUsersByEmail() method', function() {
    it('should send a GET request to /api/users', function() {
      $httpBackend.expectGET('/api/users?email=admin@open-paas.org').respond(200, []);
      userAPI.getUsersByEmail('admin@open-paas.org');
      $httpBackend.flush();
    });

    it('should return a promise', function() {
      var promise = userAPI.getUsersByEmail();

      expect(promise.then).to.be.a.function;
    });
  });
});
