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
    beforeEach(inject(function($rootScope, $controller) {
      this.invitationAPI = {};
      this.scope = $rootScope.$new();
      this.invitation = {
        status: '',
        data: {
          data: {}
        }
      };
      $controller('finalize', {
        $scope: this.scope,
        invitationAPI: this.invitationAPI,
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

    describe('passwordMatch() method', function() {
      it('should return false when passwords are undefined', function() {
        this.scope.settings = {};
        expect(this.scope.passwordMatch()).to.be.false;
      });

      it('should return false when passwords does not match', function() {
        this.scope.settings.password = 'foo';
        this.scope.settings.confirmpassword = 'bar';
        expect(this.scope.passwordMatch()).to.be.false;
      });

      it('should be false when passwords match but are empty', function() {
        this.scope.settings.password = '';
        this.scope.settings.confirmpassword = '';
        expect(this.scope.passwordMatch()).to.be.false;
      });

      it('should return true when passwords match', function() {
        this.scope.settings.password = 'secret';
        this.scope.settings.confirmpassword = 'secret';
        expect(this.scope.passwordMatch()).to.be.true;
      });
    });

    describe('passwordStrength() method', function() {
      it('should return false when passwords are undefined', function() {
        this.scope.settings.password = undefined;
        this.scope.settings.confirmpassword = undefined;
        expect(this.scope.passwordStrength()).to.be.false;
      });

      it('should return false when passwords are less then 8 characters length ', function() {
        this.scope.settings.password = '1234567';
        this.scope.settings.confirmpassword = '1234567';
        expect(this.scope.passwordStrength()).to.be.false;
      });

      it('should return true when passwords are 8 characters length', function() {
        this.scope.settings.password = '12345678';
        this.scope.settings.confirmpassword = '12345678';
        expect(this.scope.passwordStrength()).to.be.true;
      });

      it('should return true when passwords are more 8 characters length', function() {
        this.scope.settings.password = '123456789';
        this.scope.settings.confirmpassword = '123456789';
        expect(this.scope.passwordStrength()).to.be.true;
      });
    });

    describe('checkDomain() method', function() {
      it('should return true', function() {
        expect(this.scope.checkDomain()).to.be.true;
      });
    });

    describe('checkCompany() method', function() {
      it('should return true', function() {
        expect(this.scope.checkCompany()).to.be.true;
      });
    });

    describe('validValues() method', function() {
      it('should return false when settings are empty', function() {
        this.scope.settings = {};
        expect(this.scope.validValues()).to.be.false;
      });

      it('should return false when all but firstname is set', function() {
        this.scope.settings.lastname = 'bar';
        this.scope.settings.company = 'company';
        this.scope.settings.domain = 'domain';
        this.scope.settings.password = 'supersecret';
        this.scope.settings.confirmpassword = 'supersecret';
        expect(this.scope.validValues()).to.be.false;
      });

      it('should return false when all but lastname is set', function() {
        this.scope.settings.firstname = 'foo';
        this.scope.settings.company = 'company';
        this.scope.settings.domain = 'domain';
        this.scope.settings.password = 'supersecret';
        this.scope.settings.confirmpassword = 'supersecret';
        expect(this.scope.validValues()).to.be.false;
      });

      it('should return false when all but company is set', function() {
        this.scope.settings.firstname = 'foo';
        this.scope.settings.lastname = 'bar';
        this.scope.settings.domain = 'domain';
        this.scope.settings.password = 'supersecret';
        this.scope.settings.confirmpassword = 'supersecret';
        expect(this.scope.validValues()).to.be.false;
      });

      it('should return false when all but domain is set', function() {
        this.scope.settings.firstname = 'foo';
        this.scope.settings.lastname = 'bar';
        this.scope.settings.company = 'company';
        this.scope.settings.password = 'supersecret';
        this.scope.settings.confirmpassword = 'supersecret';
        expect(this.scope.validValues()).to.be.false;
      });

      it('should return false when all but password is set', function() {
        this.scope.settings.firstname = 'foo';
        this.scope.settings.lastname = 'bar';
        this.scope.settings.company = 'company';
        this.scope.settings.domain = 'domain';
        this.scope.settings.confirmpassword = 'supersecret';
        expect(this.scope.validValues()).to.be.false;
      });

      it('should return false when all but confirmpassword is set', function() {
        this.scope.settings.firstname = 'foo';
        this.scope.settings.lastname = 'bar';
        this.scope.settings.company = 'company';
        this.scope.settings.domain = 'domain';
        this.scope.settings.password = 'supersecret';
        expect(this.scope.validValues()).to.be.false;
      });

      it('should return false when all is set but passwords does not match', function() {
        this.scope.settings.firstname = 'foo';
        this.scope.settings.lastname = 'bar';
        this.scope.settings.company = 'company';
        this.scope.settings.domain = 'domain';
        this.scope.settings.password = 'secret';
        this.scope.settings.confirmpassword = 'supersecret';
        expect(this.scope.validValues()).to.be.false;
      });

      it('should return false when all is set but passwords are not strength enough', function() {
        this.scope.settings.firstname = 'foo';
        this.scope.settings.lastname = 'bar';
        this.scope.settings.company = 'company';
        this.scope.settings.domain = 'domain';
        this.scope.settings.password = 'secret';
        this.scope.settings.confirmpassword = 'secret';
        expect(this.scope.validValues()).to.be.false;
      });

      it('should return true when settings are well set', function() {
        this.scope.settings.firstname = 'foo';
        this.scope.settings.lastname = 'bar';
        this.scope.settings.company = 'company';
        this.scope.settings.domain = 'domain';
        this.scope.settings.password = 'supersecret';
        this.scope.settings.confirmpassword = 'supersecret';
        expect(this.scope.validValues()).to.be.true;
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
