'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Conference Angular module', function() {
  beforeEach(angular.mock.module('esn.conference'));

  describe('conferencesController controller', function() {
    beforeEach(angular.mock.inject(function($rootScope, $log, $window, conferenceAPI, $controller) {
      this.conferenceAPI = conferenceAPI;
      this.$rootScope = $rootScope;
      this.scope = $rootScope.$new();
      this.$log = $log;
      this.$window = $window;
      this.$timeout = function(callback, delay) {
        callback();
      };
      this.conferences = [];

      $controller('conferencesController', {
        $scope: this.scope,
        $log: this.$log,
        $window: this.$window,
        $timeout: this.$timeout,
        conferenceAPI: this.conferenceAPI,
        conferences: this.conferences
      });
    }));

    it('$scope.create should call conferenceAPI.create', function(done) {
      this.conferenceAPI.create = function() {
        done();
      };
      this.scope.create();
    });

    it('$scope.join should not call $window.open when conference is not set', function(done) {
      this.$window.open = function() {
        done(new Error());
      };
      this.scope.join();
      done();
    });

    it('$scope.join should call $window.open when conference is object', function(done) {
      var id = 123;
      this.$window.open = function(path) {
        expect(path).to.equal('/conferences/' + id);
        done();
      };
      this.scope.join({_id: id});
    });

    it('$scope.join should call conferenceAPI when conference is id', function(done) {
      var id = 123;
      this.$window.open = function(path) {
        expect(path).to.equal('/conferences/' + id);
        done();
      };
      this.scope.join(id);
    });

  });

  describe('conferenceAPI service', function() {

    describe('get() method', function() {

      beforeEach(angular.mock.inject(function(conferenceAPI, $httpBackend) {
        this.conferenceAPI = conferenceAPI;
        this.$httpBackend = $httpBackend;
        this.response = {};
      }));

      it('should send a GET request to /conferences/:id', function() {
        var id = 123;
        this.$httpBackend.expectGET('/conferences/' + id).respond(this.response);
        this.conferenceAPI.get(id);
        this.$httpBackend.flush();
      });
    });

    describe('list() method', function() {

      beforeEach(angular.mock.inject(function(conferenceAPI, $httpBackend) {
        this.conferenceAPI = conferenceAPI;
        this.$httpBackend = $httpBackend;
        this.response = [];
      }));

      it('should send a GET request to /conferences', function() {
        this.$httpBackend.expectGET('/conferences').respond(this.response);
        this.conferenceAPI.list();
        this.$httpBackend.flush();
      });
    });

    describe('create() method', function() {

      beforeEach(angular.mock.inject(function(conferenceAPI, $httpBackend) {
        this.conferenceAPI = conferenceAPI;
        this.$httpBackend = $httpBackend;
        this.response = {};
      }));

      it('should send a POST request to /conferences', function() {
        this.$httpBackend.expectPOST('/conferences').respond(this.response);
        this.conferenceAPI.create();
        this.$httpBackend.flush();
      });
    });

    describe('join() method', function() {

      beforeEach(angular.mock.inject(function(conferenceAPI, $httpBackend) {
        this.conferenceAPI = conferenceAPI;
        this.$httpBackend = $httpBackend;
        this.response = {};
      }));

      it('should send a PUT request to /conferences/:id/attendees?action=join', function() {
        var id = 123;
        this.$httpBackend.expectPUT('/conferences/' + id + '/attendees?action=join').respond(this.response);
        this.conferenceAPI.join(id);
        this.$httpBackend.flush();
      });
    });

    describe('leave() method', function() {

      beforeEach(angular.mock.inject(function(conferenceAPI, $httpBackend) {
        this.conferenceAPI = conferenceAPI;
        this.$httpBackend = $httpBackend;
        this.response = {};
      }));

      it('should send a PUT request to /conferences/:id/attendees?action=leave', function() {
        var id = 123;
        this.$httpBackend.expectPUT('/conferences/' + id + '/attendees?action=leave').respond(this.response);
        this.conferenceAPI.leave(id);
        this.$httpBackend.flush();
      });
    });

    describe('invite() method', function() {

      beforeEach(angular.mock.inject(function(conferenceAPI, $httpBackend) {
        this.conferenceAPI = conferenceAPI;
        this.$httpBackend = $httpBackend;
        this.response = {};
      }));

      it('should send a PUT request to /conferences/:id/attendees/:user_id', function() {
        var id = 123;
        var user_id = 456;
        this.$httpBackend.expectPUT('/conferences/' + id + '/attendees/' + user_id).respond(this.response);
        this.conferenceAPI.invite(id, user_id);
        this.$httpBackend.flush();
      });
    });
  });
});
