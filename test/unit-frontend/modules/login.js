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

      it('should send a request to /login', function() {
        this.$httpBackend.expectPOST('/login').respond(this.response);
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
      var self = this;
      this.loginAPI = {};
      this.searchObject = {};
      this.scope = $rootScope.$new();
      this.request = {
      };
      this.locals = {
        $scope: this.scope,
        $location: {
          path: function() {
            return '';
          },
          search: function() {
            return self.searchObject;
          }
        },
        $window: {
          location: {}
        },
        loginAPI: this.loginAPI
      };
      $controller('login', this.locals);
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

      it('should reload the page after login', function(done) {
        this.scope.form = {$invalid: false};
        this.searchObject = {
          continue: '/dummy'
        };

        this.locals.$window.location.reload = done;

        this.loginAPI.login = function() {
          return {
            then: function(next) {
              next();
            }
          };
        };

        this.scope.login();
      });

    });
  });

  describe('loginErrorService service', function() {

    beforeEach(angular.mock.inject(function(loginErrorService, $rootScope, $location) {
      this.loginErrorService = loginErrorService;
      this.$rootScope = $rootScope;
      this.$location = $location;
    }));

    it('should save the credentials and error', function(done) {
      var credentials = {username: 'foo@bar.com', password: 'secret', rememberme: true};
      var error = { error: {code: 404, message: 'this is an error message', details: 'these are details'}};
      this.loginErrorService.set(credentials, error);

      var data = this.loginErrorService.getData();

      expect(data.credentials).to.exist;
      expect(data.credentials).to.deep.equal(credentials);
      expect(data.error).to.exist;
      expect(data.error).to.deep.equal(error);
      done();
    });

    it('should reset the data on route change if location is /', function(done) {
      var credentials = {username: 'foo@bar.com', password: 'secret', rememberme: true};
      var error = { error: {code: 404, message: 'this is an error message', details: 'these are details'}};
      this.loginErrorService.set(credentials, error);
      this.$location.path('/');
      this.$rootScope.$emit('$routeChangeSuccess');
      expect(this.loginErrorService.getData()).to.deep.equal({});
      done();
    });

    it('should not reset the data on route change if location is not /', function(done) {
      var credentials = {username: 'foo@bar.com', password: 'secret', rememberme: true};
      var error = { error: {code: 404, message: 'this is an error message', details: 'these are details'}};
      this.loginErrorService.set(credentials, error);
      this.$location.path('/another');
      this.$rootScope.$emit('$routeChangeSuccess');
      expect(this.loginErrorService.getData()).to.not.deep.equal({});
      expect(this.loginErrorService.getData().credentials).to.deep.equal(credentials);
      expect(this.loginErrorService.getData().error).to.deep.equal(error);
      done();
    });
  });
});
