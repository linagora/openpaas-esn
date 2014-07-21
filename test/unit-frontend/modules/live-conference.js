'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The live-conference Angular module', function() {
  beforeEach(angular.mock.module('esn.conference'));
  beforeEach(angular.mock.module('esn.live-conference'));

  describe('liveConferenceController controller', function() {
    beforeEach(angular.mock.inject(function($rootScope, $log, conferenceAPI, domainAPI, tokenAPI, webrtcFactory, $controller, $q) {
      this.conferenceAPI = conferenceAPI;
      this.tokenAPI = tokenAPI;
      this.domainAPI = domainAPI;
      this.webrtcFactory = webrtcFactory;
      this.$rootScope = $rootScope;
      this.scope = $rootScope.$new();
      this.$log = $log;
      this.$q = $q;
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

});
