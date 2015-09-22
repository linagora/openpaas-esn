'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The User Angular module', function() {
  beforeEach(angular.mock.module('esn.user'));

  describe('userAPI service', function() {

    describe('user(:uuid) method', function() {

      beforeEach(angular.mock.inject(function(userAPI, $httpBackend) {
        this.$httpBackend = $httpBackend;
        this.userAPI = userAPI;
      }));

      it('should send a request to /users/:uuid', function() {
        var uuid = 123456789;
        this.$httpBackend.expectGET('/users/' + uuid).respond(this.response);
        this.userAPI.user(uuid);
        this.$httpBackend.flush();
      });

      it('should return a promise', function() {
        var promise = this.userAPI.user(123456789);
        expect(promise.then).to.be.a.function;
      });
    });

    describe('currentUser() method', function() {

      beforeEach(angular.mock.inject(function(userAPI, $httpBackend) {
        this.$httpBackend = $httpBackend;
        this.userAPI = userAPI;
      }));

      it('should send a request to /user', function() {
        this.$httpBackend.expectGET('/user').respond(this.response);
        this.userAPI.currentUser();
        this.$httpBackend.flush();
      });

      it('should return a promise', function() {
        var promise = this.userAPI.currentUser();
        expect(promise.then).to.be.a.function;
      });
    });

    describe('getCommunities() method', function() {

      beforeEach(angular.mock.inject(function(userAPI, $httpBackend, Restangular) {
        this.$httpBackend = $httpBackend;
        this.userAPI = userAPI;
        Restangular.setFullResponse(true);
      }));

      it('should send a GET request to /user/communities', function() {
        this.$httpBackend.expectGET('/user/communities').respond(200, []);
        this.userAPI.getCommunities();
        this.$httpBackend.flush();
      });

      it('should return a promise', function() {
        var promise = this.userAPI.getCommunities();
        expect(promise.then).to.be.a.function;
      });
    });
  });

  describe('userUtils service', function() {
    beforeEach(angular.mock.inject(function(userUtils) {
      this.userUtils = userUtils;
    }));

    describe('displayNameOf() method', function() {
      it('should return firstname lastname if both exist', function() {
        var user = {firstname: 'f' , lastname: 'l', preferredEmail: 'email' };
        expect(this.userUtils.displayNameOf(user)).to.equal('f l');
      });

      it('should return prerferredEmail if either firstname or lastname does not exist', function() {
        var user = {firstname: 'f', preferredEmail: 'email' };
        expect(this.userUtils.displayNameOf(user)).to.equal(user.preferredEmail);

        user = {lastname: 'l', preferredEmail: 'email' };
        expect(this.userUtils.displayNameOf(user)).to.equal(user.preferredEmail);
      });
    });
  });
});
