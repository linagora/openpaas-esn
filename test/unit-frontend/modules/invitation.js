'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Invitation Angular module', function() {
  beforeEach(angular.mock.module('esn.invitation'));

  describe('invitationAPI service', function() {
    describe('get() method', function() {

      beforeEach(angular.mock.inject(function(invitationAPI, $httpBackend) {
        this.invitationAPI = invitationAPI;
        this.$httpBackend = $httpBackend;
        this.invitationId = 'aaaa-bbbb-cccc';
        this.response = {
          type: 'sign-on',
          data: {
            email: 'test@linagora.com',
            firstname: 'John',
            lastname: 'Doe'
          }
        };
      }));

      it('should send a request to /invitation/:id', function() {
        this.$httpBackend.expectGET('/invitation/' + this.invitationId).respond(this.response);
        this.invitationAPI.get(this.invitationId);
        this.$httpBackend.flush();
      });

      it('should return a promise', function() {
        var promise = this.invitationAPI.get(this.invitationId);
        expect(promise.then).to.be.a.function;
      });
    });

    describe('create() method', function() {
      beforeEach(angular.mock.inject(function(invitationAPI, $httpBackend) {
        this.invitationAPI = invitationAPI;
        this.$httpBackend = $httpBackend;
        this.data = {
          type: 'signup',
          data: {
            email: 'test@linagora.com',
            firstname: 'John',
            lastname: 'Doe'
          }
        };
        this.response = {};
      }));

      it('should send a request to /invitation', function() {
        this.$httpBackend.expectPOST('/invitation').respond(this.response);
        this.invitationAPI.create(this.data);
        this.$httpBackend.flush();
      });

      it('should return a promise', function() {
        var promise = this.invitationAPI.create();
        expect(promise.then).to.be.a.function;
      });
    });

    describe('finalize() method', function() {
      beforeEach(angular.mock.inject(function(invitationAPI, $httpBackend) {
        this.invitationAPI = invitationAPI;
        this.$httpBackend = $httpBackend;
        this.uuid = '123456789';
        this.data = {
          type: 'signup',
          data: {
            firstname: 'John',
            lastname: 'Doe',
            password: 'secret',
            confirmpassword: 'secret',
            domain: 'mydomain',
            company: 'mycompany'
          }
        };
        this.response = {};
      }));

      it('should send a JSON PUT to /invitation/:uuid', function() {
        this.$httpBackend.expectPUT('/invitation/' + this.uuid, this.data).respond(this.response);
        this.invitationAPI.finalize(this.uuid, this.data);
        this.$httpBackend.flush();
      });

      it('should return a promise', function() {
        var promise = this.invitationAPI.finalize();
        expect(promise.then).to.be.a.function;
      });

    });
  });

  describe('finalizeController', function() {
    beforeEach(inject(function($rootScope, $controller, $window) {
      this.invitationAPI = {};
      this.loginAPI = {};
      this.$window = $window;
      this.scope = $rootScope.$new();
      this.invitation = {
        status: '',
        data: {
          data: {}
        }
      };
      $controller('finalize', {
        $scope: this.scope,
        $window: this.$window,
        invitationAPI: this.invitationAPI,
        loginAPI: this.loginAPI,
        invitation: this.invitation
      });
    }));

    describe('finalize() method', function() {
      it('should call the invitationAPI.finalize() method', function(done) {
        this.invitationAPI.finalize = function(id, settings) {
          done();
        };
        this.scope.finalize();
      });

      it('should call the invitationAPI.finalize() method with scope settings and invitation UUID', function(done) {
        this.scope.invitationId = '123456789';
        this.scope.settings.firstname = 'foo';
        this.scope.settings.lastname = 'bar';
        this.scope.settings.company = 'company';
        this.scope.settings.domain = 'domain';
        this.scope.settings.password = 'supersecret';
        this.scope.settings.confirmpassword = 'supersecret';
        this.invitationAPI.finalize = function(uuid, settings) {
          expect(uuid).to.equal('123456789');
          expect(settings.type).to.equal('signup');
          expect(settings.data.firstname).to.equal('foo');
          expect(settings.data.lastname).to.equal('bar');
          expect(settings.data.company).to.equal('company');
          expect(settings.data.domain).to.equal('domain');
          expect(settings.data.password).to.equal('supersecret');
          expect(settings.data.confirmpassword).to.equal('supersecret');
          done();
        };
        this.scope.finalize();
      });
    });
  });

  describe('signupController', function() {
    beforeEach(inject(function($rootScope, $controller) {
      this.invitationAPI = {};
      this.scope = $rootScope.$new();
      $controller('signup', {
        $scope: this.scope,
        invitationAPI: this.invitationAPI
      });
    }));

    describe('signup()', function() {
      it('should call the invitationAPI.create() method', function(done) {
        this.scope.form = {$invalid: false};
        this.invitationAPI.create = function() {
          done();
        };
        this.scope.signup();
      });

      it('should call the invitationAPI.create() method with scope settings', function(done) {
        this.scope.settings.firstname = 'Foo';
        this.scope.settings.lastname = 'Bar';
        this.scope.settings.email = 'foo@bar.com';
        this.scope.form = {$invalid: false};
        this.invitationAPI.create = function(settings) {
          expect(settings.type).to.equal('signup');
          expect(settings.data.firstname).to.equal('Foo');
          expect(settings.data.lastname).to.equal('Bar');
          expect(settings.data.email).to.equal('foo@bar.com');
          done();
        };
        this.scope.signup();
      });
    });
  });

});
