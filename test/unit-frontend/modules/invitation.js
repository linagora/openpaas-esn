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
  });
});
