'use strict';

/* global chai: false */

var expect = chai.expect;

describe('userAPI service', function() {
  var $httpBackend, userAPI, sessionMock;

  beforeEach(function() {
    module('esn.user');

    sessionMock = {};

    module(function($provide) {
      $provide.value('session', sessionMock);
    });

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

  describe('The setUserEmails method', function() {
    it('should send a request to /api/users/:uuid/emails', function() {
      var domainId = 456;
      var userId = 123;
      var emails = ['foo@bar.lng'];

      $httpBackend.expectPUT('/api/users/' + userId + '/states?domain_id=' + domainId, emails).respond(this.response);
      userAPI.setUserStates(userId, emails, domainId);
      $httpBackend.flush();
    });

    it('should send a request to /api/users/:uuid/emails with the current domain of the modifier if domainId is not provided', function() {
      var domainId = 456;
      var userId = 123;
      var emails = ['foo@bar.lng'];

      sessionMock.domain = {
        _id: domainId
      };

      $httpBackend.expectPUT('/api/users/' + userId + '/states?domain_id=' + domainId, emails).respond(this.response);
      userAPI.setUserStates(userId, emails);
      $httpBackend.flush();
    });
  });

  describe('The provisionUsers method', function() {
    it('should send a request to /api/users/provision', function() {
      var data = ['foo', 'bar'];
      var source = 'oauth';

      $httpBackend.expectPOST('/api/users/provision?source=oauth', data).respond(this.response);
      userAPI.provisionUsers(source, data);
      $httpBackend.flush();
    });
  });
});
