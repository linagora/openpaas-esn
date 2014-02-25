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

    it('should start at step 0', function() {
      expect(this.scope.step).to.equals(0);
    });

    describe('validValues() method', function() {
      it('should return false if no firstname set', function() {
        this.scope.settings.firstname = '';
        this.scope.settings.lastname = 'Bar';
        this.scope.settings.email = 'foo@bar.com';
        expect(this.scope.validValues()).to.be.false;
      });
      it('should return false if no lastname set', function() {
        this.scope.settings.firstname = 'Foo';
        this.scope.settings.lastname = '';
        this.scope.settings.email = 'foo@bar.com';
        expect(this.scope.validValues()).to.be.false;
      });
      it('should return false if no email set', function() {
        this.scope.settings.firstname = 'Foo';
        this.scope.settings.lastname = 'Bar';
        this.scope.settings.email = '';
        expect(this.scope.validValues()).to.be.false;
      });
      it('should return false if nothing is set', function() {
        this.scope.settings.firstname = '';
        this.scope.settings.lastname = '';
        this.scope.settings.email = '';
        expect(this.scope.validValues()).to.be.false;
      });

      it('should return false if email is not an email', function() {
        this.scope.settings.firstname = 'Foo';
        this.scope.settings.lastname = 'Bar';
        this.scope.settings.email = 'Baz';
        expect(this.scope.validValues()).to.be.false;
      });

      it('should return true if all is set', function() {
        this.scope.settings.firstname = 'Foo';
        this.scope.settings.lastname = 'Bar';
        this.scope.settings.email = 'foo@bar.com';
        expect(this.scope.validValues()).to.be.true;
      });
    });

    describe('signup()', function() {
      it('should call the invitationAPI.create() method', function(done) {
        this.invitationAPI.create = function() {
          done();
        };
        this.scope.signup();
      });

      it('should call the invitationAPI.create() method with scope settings', function(done) {
        this.scope.settings.firstname = 'Foo';
        this.scope.settings.lastname = 'Bar';
        this.scope.settings.email = 'foo@bar.com';
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
