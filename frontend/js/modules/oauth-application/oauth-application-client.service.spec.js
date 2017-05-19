'use strict';

/* global chai: false */
var expect = chai.expect;

describe('The ESNOauthApplicationClient factory', function() {
  beforeEach(angular.mock.module('esn.oauth-application'));

  beforeEach(angular.mock.inject(function(ESNOauthApplicationClient, $httpBackend) {
    this.ESNOauthApplicationClient = ESNOauthApplicationClient;
    this.$httpBackend = $httpBackend;
    this.response = [];
  }));

  describe('The get function', function() {
    it('should send a request to /api/oauth/clients/:id', function() {
      var id = 123;

      this.$httpBackend.expectGET('/api/oauth/clients/' + id).respond(this.response);
      this.ESNOauthApplicationClient.get(id);
      this.$httpBackend.flush();
    });

    it('should return a promise', function() {
      var promise = this.ESNOauthApplicationClient.get();

      expect(promise.then).to.be.a.function;
    });
  });

  describe('The list function', function() {
    it('should send a request to /api/oauth/clients', function() {
      this.$httpBackend.expectGET('/api/oauth/clients').respond(this.response);
      this.ESNOauthApplicationClient.list();
      this.$httpBackend.flush();
    });

    it('should return a promise', function() {
      var promise = this.ESNOauthApplicationClient.list();

      expect(promise.then).to.be.a.function;
    });
  });

  describe('The created function', function() {
    it('should send a request to /api/user/oauth/clients', function() {
      this.$httpBackend.expectGET('/api/user/oauth/clients').respond(this.response);
      this.ESNOauthApplicationClient.created();
      this.$httpBackend.flush();
    });

    it('should return a promise', function() {
      var promise = this.ESNOauthApplicationClient.created();

      expect(promise.then).to.be.a.function;
    });
  });

  describe('The create function', function() {
    it('should send a POST request to /api/oauth/clients', function() {
      this.$httpBackend.expectPOST('/api/oauth/clients').respond(this.response);
      this.ESNOauthApplicationClient.create({});
      this.$httpBackend.flush();
    });

    it('should return a promise', function() {
      var promise = this.ESNOauthApplicationClient.create({});

      expect(promise.then).to.be.a.function;
    });
  });

  describe('The remove function', function() {
    it('should send a DELETE request to /api/oauth/clients', function() {
      var id = 123;

      this.$httpBackend.expectDELETE('/api/oauth/clients/' + id).respond(this.response);
      this.ESNOauthApplicationClient.remove(id);
      this.$httpBackend.flush();
    });

    it('should return a promise', function() {
      var promise = this.ESNOauthApplicationClient.remove(123);

      expect(promise.then).to.be.a.function;
    });
  });
});
