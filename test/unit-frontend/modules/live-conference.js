'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The live-conference Angular module', function() {
  beforeEach(angular.mock.module('esn.conference'));
  beforeEach(angular.mock.module('esn.live-conference'));

  describe('easyRTCService service', function() {
    var service, $q, tokendefer, $rootScope, $log, tokenAPI, session, webrtcFactory;

    beforeEach(function() {
      tokenAPI = {};
      $log = {
        debug: function() {}
      };
      session = {
        user: {
          _id: 2,
          emails: ['test@openpaas.io']
        },
        domain: {
          _id: 123
        }
      };

      webrtcFactory = {
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

      module(function($provide) {
        $provide.value('$log', $log);
        $provide.value('tokenAPI', tokenAPI);
        $provide.value('session', session);
        $provide.value('webrtcFactory', webrtcFactory);
      });
    });

    it('$scope.performCall should hangupAll', function(done) {
      webrtcFactory = {
        get: function() {
          return {
            hangupAll: function() {
              done();
            }
          };
        }
      };

      module(function($provide) {
        $provide.value('webrtcFactory', webrtcFactory);
      });

      inject(function($injector) {
        service = $injector.get('easyRTCService');
      });

      service.performCall('YOLO');
    });

    it('$scope.performCall should call the given user id', function(done) {
      var user_id = 123;

      webrtcFactory = {
        get: function() {
          return {
            hangupAll: function() {},
            call: function(id) {
              expect(id).to.equal(user_id);
              done();
            }
          };

        }
      };

      module(function($provide) {
        $provide.value('webrtcFactory', webrtcFactory);
      });

      inject(function($injector) {
        service = $injector.get('easyRTCService');
      });

      service.performCall(user_id);
    });

    it('$scope.connect should create the easyRTC app if token is retrieved', function(done) {

      tokenAPI.getNewToken = function() {
        tokendefer = $q.defer();
        return tokendefer.promise;
      };

      webrtcFactory = {
        get: function() {
          return {
            setRoomOccupantListener: function() {},
            setRoomEntryListener: function() {},
            setDisconnectListener: function() {},
            joinRoom: function() {},
            setSocketOptions: function() {},
            easyApp: function() {
              done();
            }
          };
        }
      };

      module(function($provide) {
        $provide.value('tokenAPI', tokenAPI);
        $provide.value('webrtcFactory', webrtcFactory);
      });

      inject(function($injector, _$q_, _$rootScope_) {
        service = $injector.get('easyRTCService');
        $q = _$q_;
        $rootScope = _$rootScope_;
      });

      service.connect({ _id: 123 }, {}, []);

      tokendefer.resolve({token: '123'});
      $rootScope.$digest();
    });



    it('$scope.connect should not create the easyRTC app if token is not retrieved', function(done) {
      $log.error = function() {
        done();
      };

      webrtcFactory = {
        get: function() {
          return {
            setRoomOccupantListener: function() {},
            setRoomEntryListener: function() {},
            setDisconnectListener: function() {},
            joinRoom: function() {},
            setSocketOptions: function() {},
            easyApp: function() {
              done(new Error());
            }
          };
        }
      };

      tokenAPI.getNewToken = function() {
        tokendefer = $q.defer();
        return tokendefer.promise;
      };

      module(function($provide) {
        $provide.value('$log', $log);
        $provide.value('tokenAPI', tokenAPI);
        $provide.value('webrtcFactory', webrtcFactory);
      });

      inject(function($injector, _$q_, _$rootScope_) {
        service = $injector.get('easyRTCService');
        $q = _$q_;
        $rootScope = _$rootScope_;
      });

      service.connect({ _id: 123 }, {}, []);
      tokendefer.reject({data: 'ERROR'});
      $rootScope.$digest();
    });
  });

  describe('liveConferenceController controller', function() {
    beforeEach(angular.mock.inject(function($rootScope, $log, conferenceAPI, domainAPI, tokenAPI, $controller, $q) {
      this.conferenceAPI = conferenceAPI;
      this.tokenAPI = tokenAPI;
      this.domainAPI = domainAPI;
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

      $controller('liveConferenceController', {
        $scope: this.scope,
        $log: this.$log,
        session: this.session,
        conferenceAPI: this.conferenceAPI,
        domainAPI: this.domainAPI,
        tokenAPI: this.tokenAPI,
        conference: this.conference
      });
    }));

    it('$scope.invite should call conferenceAPI.invite', function(done) {
      this.conferenceAPI.invite = function() {
        done();
      };
      this.scope.invite({_id: 123});
    });
  });

});
