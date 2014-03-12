'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Login Angular module', function() {
  beforeEach(angular.mock.module('esn.login'));

  describe('loginAPI service', function() {

    describe('login() method', function() {

      beforeEach(angular.mock.inject(function(loginAPI, $httpBackend) {
        this.$httpBackend = $httpBackend;
        this.loginAPI = loginAPI;

        this.request = {
          username: 'foo@bar.com',
          password: 'secret',
          rememberme: true
        };

        this.response = {
          firstname: 'foo',
          lastname: 'bar'
        };
      }));

      it('should send a request to /api/login', function() {
        this.$httpBackend.expectPOST('/api/login').respond(this.response);
        this.loginAPI.login(this.request);
        this.$httpBackend.flush();
      });

      it('should return a promise', function() {
        var promise = this.loginAPI.login(this.request);
        expect(promise.then).to.be.a.function;
      });
    });
  });

  describe('loginController', function() {
    beforeEach(inject(function($rootScope, $controller) {
      this.loginAPI = {};
      this.scope = $rootScope.$new();
      this.request = {
      };
      $controller('login', {
        $scope: this.scope,
        $location: {},
        loginAPI: this.loginAPI
      });
    }));

    describe('login() method', function() {

      it('should call the loginAPI.login() method', function(done) {
        this.scope.form = {$invalid: false};
        this.loginAPI.login = function() {
          done();
        };
        this.scope.login();
      });

      it('should call the loginAPI.login() method with scope credentials', function(done) {
        this.scope.form = {$invalid: false};
        this.scope.credentials.username = 'foo@bar.com';
        this.scope.credentials.password = 'secret';
        this.scope.credentials.rememberme = true;
        this.loginAPI.login = function(credentials) {
          expect(credentials.username).to.equal('foo@bar.com');
          expect(credentials.password).to.equal('secret');
          expect(credentials.rememberme).to.be.true;
          done();
        };
        this.scope.login();
      });

    });
  });
});
