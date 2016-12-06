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

      it('should send a request to /api/invitations/:id', function() {
        this.$httpBackend.expectGET('/api/invitations/' + this.invitationId).respond(this.response);
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

      it('should send a request to /api/invitations', function() {
        this.$httpBackend.expectPOST('/api/invitations').respond(this.response);
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

      it('should send a JSON PUT to /api/invitations/:uuid', function() {
        this.$httpBackend.expectPUT('/api/invitations/' + this.uuid, this.data).respond(this.response);
        this.invitationAPI.finalize(this.uuid, this.data);
        this.$httpBackend.flush();
      });

      it('should return a promise', function() {
        var promise = this.invitationAPI.finalize();
        expect(promise.then).to.be.a.function;
      });

    });
  });
});
