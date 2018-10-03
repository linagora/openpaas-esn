'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The Login Angular module', function() {
  beforeEach(angular.mock.module('esn.login'));

  describe('loginAPI service', function() {
    var momentMock = {
      tz: {
        guess: function() { return 'foobar'; }
      }
    };

    beforeEach(function() {
      module(function($provide) {
        $provide.constant('moment', momentMock);
      });
    });

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

      it('should send a request with header contains detected time zone in X-ESN-Time-Zone field to /api/login', function() {
        this.$httpBackend.expectPOST('/api/login', this.request, function(headers) {
          return headers['X-ESN-Time-Zone'] === momentMock.tz.guess();
        }).respond(this.response);
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
    var $rootScope;

    beforeEach(inject(function(_$rootScope_, $controller) {
      var self = this;

      this.loginAPI = {};
      this.searchObject = {};
      this.notificationFactory = {};
      $rootScope = _$rootScope_;
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
        esnLoginSuccessService: sinon.spy(),
        loginAPI: this.loginAPI,
        notificationFactory: this.notificationFactory,
        RESET_PASSWORD_ENABLED: true
      };
      $controller('login', this.locals);
    }));

    describe('login() method', function() {

      it('should call the loginAPI.login() method', function(done) {
        this.scope.form = {$invalid: false};
        this.loginAPI.login = function() {
          done();
        };
        this.scope.login(this.scope.form);
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
        this.scope.login(this.scope.form);
      });

      it('should fire the esnLoginSuccessService function on successful login', function() {
        this.scope.form = {$invalid: false};
        this.searchObject = {
          continue: '/dummy'
        };

        this.loginAPI.login = function() {
          return {
            then: function(next) {
              return $q.when(next);
            }
          };
        };

        this.scope.login(this.scope.form);
        $rootScope.$digest();

        expect(this.locals.esnLoginSuccessService).to.have.been.calledOnce;
      });

      it('should display an error message when login fails', function(done) {
        this.scope.form = {$invalid: false};

        this.notificationFactory.weakError = function(message, text) {
          expect(message).to.match(/Login error/);
          expect(text).to.match(/Please check your credentials/);
          done();
        };

        this.loginAPI.login = function() {
          return $q.reject({data: {}});
        };
        this.scope.login(this.scope.form);
        this.scope.$digest();
      });

      it('should display an error message when account has been disabled', function(done) {
        this.scope.form = {$invalid: false};

        this.notificationFactory.weakError = function(message, text) {
          expect(message).to.match(/Login disabled/);
          expect(text).to.match(/This account has been disabled/);
          done();
        };

        this.loginAPI.login = function() {
          return $q.reject({data: {error: {details: 'The specified account is disabled'}}});
        };
        this.scope.login(this.scope.form);
        this.scope.$digest();
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
      this.$rootScope.$emit('$stateChangeSuccess');
      expect(this.loginErrorService.getData()).to.deep.equal({});
      done();
    });

    it('should not reset the data on route change if location is not /', function(done) {
      var credentials = {username: 'foo@bar.com', password: 'secret', rememberme: true};
      var error = { error: {code: 404, message: 'this is an error message', details: 'these are details'}};
      this.loginErrorService.set(credentials, error);
      this.$location.path('/another');
      this.$rootScope.$emit('$stateChangeSuccess');
      expect(this.loginErrorService.getData()).to.not.deep.equal({});
      expect(this.loginErrorService.getData().credentials).to.deep.equal(credentials);
      expect(this.loginErrorService.getData().error).to.deep.equal(error);
      done();
    });
  });

  describe('changePasswordController', function() {
    var loginAPI, notificationFactory, $scope, locals;

    beforeEach(inject(function($rootScope, $controller) {
      loginAPI = {};
      notificationFactory = {};
      $scope = $rootScope.$new();
      locals = {
        $scope: $scope,
        loginAPI: loginAPI,
        notificationFactory: notificationFactory
      };
      $controller('changePasswordController', locals);
    }));

    it('should call loginAPI.changePassword()', function(done) {
      $scope.form = {$invalid: false};

      loginAPI.changePassword = function() {
        done();
      };
      $scope.changePassword($scope.form);
    });

    it('should call the loginAPI.changePassword() method with old and new passwords', function(done) {
      var credentials = {
        oldpassword: 'oldpassword',
        newpassword: 'newpassword'
      };

      $scope.form = {$invalid: false};
      $scope.credentials = credentials;

      loginAPI.changePassword = function(oldpassword, newpassword) {
        expect(oldpassword).to.equal(credentials.oldpassword);
        expect(newpassword).to.equal(credentials.newpassword);
        done();
      };

      $scope.changePassword($scope.form);
    });

    it('should show an error notification incase of invalid password', function(done) {
      $scope.form = {$invalid: false};

      loginAPI.changePassword = function() {
        return $q.reject({data: {error: {details: 'The passwords do not match'}}});
      };
      notificationFactory.weakError = function(message, text) {
        expect(text).to.match(/Old password is invalid/);
        done();
      };

      $scope.changePassword($scope.form);
      $scope.$digest();
    });

    it('should show a general error notification in case of server error', function(done) {
      $scope.form = {$invalid: false};
      notificationFactory.weakError = function(message, text) {
        expect(text).to.match(/Failed to change password, try again later/);
        done();
      };
      loginAPI.changePassword = function() {
        return $q.reject({data: {error: {details: 'Failed to change password'}}});
      };
      $scope.changePassword($scope.form);
      $scope.$digest();
    });
  });
});
