'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Application Angular module', function() {
  beforeEach(angular.mock.module('esn.application'));

  describe('applicationController controller', function() {
    beforeEach(angular.mock.inject(function($controller, $rootScope, $log, $location, $q, applicationAPI) {
      this.applicationAPI = applicationAPI;
      this.$controller = $controller;
      this.$location = $location;
      this.$log = $log;
      this.$q = $q;
      this.$rootScope = $rootScope;
      this.scope = $rootScope.$new();
      this.applications = [];
      $controller('applicationController', {
        $scope: this.scope,
        $log: this.$log,
        $location: this.$location,
        applicationAPI: this.applicationAPI,
        applications: this.applications
      });
    }));

    it('$scope.create should call applicationAPI.create when client is defined', function(done) {
      this.applicationAPI.create = function() {
        done();
      };
      this.scope.create({});
    });

    it('$scope.create should not call applicationAPI.create when client is undefined', function(done) {
      this.$log.error = function(message) {
        expect(message).to.match(/Client is required/);
        done();
      };

      this.applicationAPI.create = function() {
        done(new Error());
      };
      this.scope.create();
    });

    it('$scope.create should redirect to application details on create success', function(done) {
      var d = this.$q.defer();
      d.resolve({data: {_id: '123'}});

      this.applicationAPI.create = function() {
        return d.promise;
      };

      this.$location.path = function() {
        return done();
      };

      this.scope.create({});
      this.$rootScope.$digest();
    });

    it('$scope.create should log error on create failure', function(done) {
      var d = this.$q.defer();
      d.reject({error: 'ooops'});

      this.applicationAPI.create = function() {
        return d.promise;
      };

      this.$location.path = function() {
        return done(new Error());
      };

      this.$log.error = function() {
        return done();
      };

      this.scope.create({});
      this.$rootScope.$digest();
    });
  });

  describe('applicationAPI service', function() {
    describe('get() method', function() {

      beforeEach(angular.mock.inject(function(applicationAPI, $httpBackend) {
        this.applicationAPI = applicationAPI;
        this.$httpBackend = $httpBackend;
        this.response = [];
      }));

      it('should send a request to /oauth/clients/:id', function() {
        var id = 123;
        this.$httpBackend.expectGET('/oauth/clients/' + id).respond(this.response);
        this.applicationAPI.get(id);
        this.$httpBackend.flush();
      });

      it('should return a promise', function() {
        var promise = this.applicationAPI.get();
        expect(promise.then).to.be.a.function;
      });
    });

    describe('list() method', function() {

      beforeEach(angular.mock.inject(function(applicationAPI, $httpBackend) {
        this.applicationAPI = applicationAPI;
        this.$httpBackend = $httpBackend;
        this.response = [];
      }));

      it('should send a request to /oauth/clients', function() {
        this.$httpBackend.expectGET('/oauth/clients').respond(this.response);
        this.applicationAPI.list();
        this.$httpBackend.flush();
      });

      it('should return a promise', function() {
        var promise = this.applicationAPI.list();
        expect(promise.then).to.be.a.function;
      });
    });

    describe('create() method', function() {

      beforeEach(angular.mock.inject(function(applicationAPI, $httpBackend) {
        this.applicationAPI = applicationAPI;
        this.$httpBackend = $httpBackend;
        this.response = [];
      }));

      it('should send a POST request to /oauth/clients', function() {
        this.$httpBackend.expectPOST('/oauth/clients').respond(this.response);
        this.applicationAPI.create({});
        this.$httpBackend.flush();
      });

      it('should return a promise', function() {
        var promise = this.applicationAPI.create({});
        expect(promise.then).to.be.a.function;
      });
    });

    describe('remove() method', function() {

      beforeEach(angular.mock.inject(function(applicationAPI, $httpBackend) {
        this.applicationAPI = applicationAPI;
        this.$httpBackend = $httpBackend;
        this.response = [];
      }));

      it('should send a DELETE request to /oauth/clients', function() {
        var id = 123;
        this.$httpBackend.expectDELETE('/oauth/clients/' + id).respond(this.response);
        this.applicationAPI.remove(id);
        this.$httpBackend.flush();
      });

      it('should return a promise', function() {
        var promise = this.applicationAPI.remove(123);
        expect(promise.then).to.be.a.function;
      });
    });
  });
});
