'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Conference Angular module', function() {
  beforeEach(angular.mock.module('esn.conference'));

  describe('liveConferenceController controller', function() {
    beforeEach(angular.mock.inject(function($rootScope, $log, $location, conferenceAPI, domainAPI, tokenAPI, webrtcFactory, $controller, $q) {
      this.conferenceAPI = conferenceAPI;
      this.tokenAPI = tokenAPI;
      this.domainAPI = domainAPI;
      this.webrtcFactory = webrtcFactory;
      this.$rootScope = $rootScope;
      this.scope = $rootScope.$new();
      this.$log = $log;
      this.$q = $q;
      this.$location = $location;
      this.conference = {
        _id: 1
      };
      this.session = {
        user: {
          _id: 2,
          emails: ['test@openpaas.io']
        },
        domain: {
          _id: 123
        }
      };

      this.webrtcFactory = {
          get: function() {
            return {
              setRoomOccupantListener: function() {},
              setRoomEntryListener: function() {},
              setDisconnectListener: function() {},
              joinRoom: function() {},
              easyApp: function() {},
              hangupAll: function() {},
              setOnCall: function() {},
              setOnHangup: function() {},
              setSocketOptions: function() {}
            };
        }
      };

      $controller('liveConferenceController', {
        $scope: this.scope,
        $log: this.$log,
        $location: this.$location,
        socket: this.socket,
        session: this.session,
        conferenceAPI: this.conferenceAPI,
        domainAPI: this.domainAPI,
        tokenAPI: this.tokenAPI,
        webrtcFactory: this.webrtcFactory,
        conference: this.conference
      });
    }));

    it('$scope.invite should call conferenceAPI.invite', function(done) {
      this.conferenceAPI.invite = function() {
        done();
      };
      this.scope.invite({_id: 123});
    });

    it('$scope.performCall should hangupAll', function(done) {
      this.scope.easyrtc.hangupAll = function() {
        done();
      };
      this.scope.performCall('YOLO');
    });

    it('$scope.performCall should call the given user id', function(done) {
      var user_id = 123;
      this.scope.easyrtc.call = function(id) {
        expect(id).to.equal(user_id);
        done();
      };
      this.scope.easyrtc.hangupAll = function() {};
      this.scope.performCall(user_id);
    });

    it('$scope.connect should create the easyRTC app if token is retrieved', function(done) {
      var d = this.$q.defer();
      d.resolve({token: '123'});

      this.tokenAPI.getNewToken = function() {
        return d.promise;
      };

      this.scope.easyrtc.easyApp = function() {
        done();
      };
      this.scope.connect();
      this.$rootScope.$digest();
    });

    it('$scope.connect should not create the easyRTC app if token is not retrieved', function(done) {
      var d = this.$q.defer();
      d.reject({data: 'ERROR'});

      this.tokenAPI.getNewToken = function() {
        return d.promise;
      };

      this.$log.error = function() {
        done();
      };

      this.scope.easyrtc.easyApp = function() {
        done(new Error());
      };
      this.scope.connect();
      this.$rootScope.$digest();
    });
  });

  describe('conferencesController controller', function() {
    beforeEach(angular.mock.inject(function($rootScope, $log, $location, conferenceAPI, $controller) {
      this.conferenceAPI = conferenceAPI;
      this.$rootScope = $rootScope;
      this.scope = $rootScope.$new();
      this.$log = $log;
      this.$location = $location;
      this.$timeout = function(callback, delay) {
        callback();
      };
      this.conferences = [];

      $controller('conferencesController', {
        $scope: this.scope,
        $log: this.$log,
        $location: this.$location,
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

    it('$scope.join should not call $location when conference is not set', function(done) {
      this.$location.path = function() {
        done(new Error());
      };
      this.scope.join();
      done();
    });

    it('$scope.join should call $location when conference is object', function(done) {
      var id = 123;
      this.$location.path = function(path) {
        expect(path).to.equal('/conferences/' + id);
        done();
      };
      this.scope.join({_id: id});
    });

    it('$scope.join should call conferenceAPI when conference is id', function(done) {
      var id = 123;
      this.$location.path = function(path) {
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
