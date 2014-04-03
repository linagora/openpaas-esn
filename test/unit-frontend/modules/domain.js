'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Domain Angular module', function() {
  beforeEach(angular.mock.module('esn.domain'));

  describe('domainAPI service', function() {

    describe('inviteUsers() method', function() {
      beforeEach(angular.mock.inject(function(domainAPI, $httpBackend, Restangular) {
        this.domainAPI = domainAPI;
        this.$httpBackend = $httpBackend;
        this.domainId = '123456789';
        // The full response configuration option has to be set at the application level
        // It is set here to get the same behavior
        Restangular.setFullResponse(true);
      }));

      it('should send a POST to /domains/:uuid/invitations', function() {
        var users = ['foo@bar.com', 'baz@bar.com', 'qux@bar.com', 'yolo@bar.com'];
        this.$httpBackend.expectPOST('/domains/' + this.domainId + '/invitations', users).respond(202);
        this.domainAPI.inviteUsers(this.domainId, users);
        this.$httpBackend.flush();
      });

      it('should return a promise', function() {
        var promise = this.domainAPI.inviteUsers(this.domainId, {});
        expect(promise.then).to.be.a.function;
      });
    });

    describe('getMembers() method', function() {

      beforeEach(angular.mock.inject(function(domainAPI, $httpBackend, Restangular) {
        this.domainAPI = domainAPI;
        this.$httpBackend = $httpBackend;
        this.domainId = '123456789';
        this.response = [{name: 'MyDomain', company_name: 'MyAwesomeCompany'}];
        this.headers = {'x-esn-items-count': this.response.length};

        // The full response configuration option has to be set at the application level
        // It is set here to get the same behavior
        Restangular.setFullResponse(true);
      }));

      it('should send a request to /domains/:uuid', function() {
        this.$httpBackend.expectGET('/domains/' + this.domainId + '/members').respond(200, this.response, this.headers);
        this.domainAPI.getMembers(this.domainId);
        this.$httpBackend.flush();
      });

      it('should send a request to /domains/:uuid/members?limit=10&offset=20', function() {
        var query = {limit: 10, offset: 20};
        this.$httpBackend.expectGET('/domains/' + this.domainId + '/members?limit=' + query.limit + '&offset=20').respond(200, this.response, this.headers);
        this.domainAPI.getMembers(this.domainId, query);
        this.$httpBackend.flush();
      });

      it('should send a request to /domains/:uuid?search=foo+bar', function() {
        var query = {search: 'foo bar'};
        this.$httpBackend.expectGET('/domains/' + this.domainId + '/members?search=foo+bar').respond(200, this.response, this.headers);
        this.domainAPI.getMembers(this.domainId, query);
        this.$httpBackend.flush();
      });

      it('should be able to get the count header from the response', function(done) {
        this.$httpBackend.expectGET('/domains/' + this.domainId + '/members').respond(200, this.response, this.headers);
        var self = this;
        this.domainAPI.getMembers(this.domainId, {}).then(
          function(data) {
            expect(data).to.be.not.null;
            expect(data.headers).to.be.a.function;
            expect(data.headers('x-esn-items-count')).to.be.not.null;
            expect(data.headers('x-esn-items-count')).to.equal('' + self.headers['x-esn-items-count']);
            done();
          },
          function(err) {
            done(err);
          });
        this.$httpBackend.flush();
      });

      it('should return a promise', function() {
        var promise = this.domainAPI.getMembers(this.domainId, {});
        expect(promise.then).to.be.a.function;
      });
    });
  });
});
