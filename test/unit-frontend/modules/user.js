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

      it('should send a request to /user/:uuid', function() {
        var uuid = 123456789;
        this.$httpBackend.expectGET('/user/' + uuid).respond(this.response);
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
});
