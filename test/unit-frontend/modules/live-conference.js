'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The live-conference Angular module', function() {
  beforeEach(angular.mock.module('esn.conference'));
  beforeEach(angular.mock.module('esn.live-conference'));

  describe('easyRTCService service', function() {
    var service, $q, $rootScope, $log, tokenAPI, session, webrtcFactory;

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
            useThisSocketConnection: function() {}
          };
        }
      };

      var ioSocketConnection = {
        isConnected: function() {
          return true;
        },
        getSio: function() {
          return this.sio;
        },
        addConnectCallback: function(callback) {
          this.connectCallback = callback;
        },
        addDisconnectCallback: function() {}
      };
      this.ioSocketConnection = ioSocketConnection;

      module(function($provide) {
        $provide.value('$log', $log);
        $provide.value('tokenAPI', tokenAPI);
        $provide.value('session', session);
        $provide.value('webrtcFactory', webrtcFactory);
        $provide.value('ioSocketConnection', ioSocketConnection);
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

    it('$scope.connect should create the easyRTC app when the socketIO connection becomes available', function(done) {
      this.ioSocketConnection.sio = {};
      this.ioSocketConnection.isConnected = function() {
        return false;
      };

      webrtcFactory = {
        get: function() {
          return {
            setRoomOccupantListener: function() {},
            setRoomEntryListener: function() {},
            setDisconnectListener: function() {},
            joinRoom: function() {},
            useThisSocketConnection: function() {},
            easyApp: function() {
              done();
            }
          };
        }
      };

      module(function($provide) {
        $provide.value('webrtcFactory', webrtcFactory);
      });

      inject(function($injector, _$q_, _$rootScope_) {
        service = $injector.get('easyRTCService');
        $q = _$q_;
        $rootScope = _$rootScope_;
      });

      service.connect({ _id: 123 }, {}, []);
      expect(this.ioSocketConnection.connectCallback).to.be.a('function');
      this.ioSocketConnection.connectCallback();
    });

    it('$scope.connect should give the socketIO instance to easyrtc', function(done) {
      var self = this;
      this.ioSocketConnection.isConnected = function() {
        return true;
      };
      this.ioSocketConnection.sio = {websocket: true};

      webrtcFactory = {
        get: function() {
          return {
            setRoomOccupantListener: function() {},
            setRoomEntryListener: function() {},
            setDisconnectListener: function() {},
            joinRoom: function() {},
            useThisSocketConnection: function(sio) {
              expect(sio).to.deep.equal(self.ioSocketConnection.sio);
              done();
            },
            easyApp: function() {
            }
          };
        }
      };

      module(function($provide) {
        $provide.value('webrtcFactory', webrtcFactory);
      });

      inject(function($injector, _$q_, _$rootScope_) {
        service = $injector.get('easyRTCService');
        $q = _$q_;
        $rootScope = _$rootScope_;
      });

      service.connect({ _id: 123 }, {}, []);
    });

    it('$scope.connect should create the easyRTC app if the socketIO connection is available', function(done) {
      var self = this;
      this.ioSocketConnection.sio = {};
      this.ioSocketConnection.isConnected = function() {
        self.ioSocketConnection.addConnectCallback = function(cb) {
          return done(new Error('I should not be called ' + cb));
        };
        return true;
      };

      webrtcFactory = {
        get: function() {
          return {
            setRoomOccupantListener: function() {},
            setRoomEntryListener: function() {},
            setDisconnectListener: function() {},
            joinRoom: function() {},
            useThisSocketConnection: function() {},
            easyApp: function() {
              done();
            }
          };
        }
      };

      module(function($provide) {
        $provide.value('webrtcFactory', webrtcFactory);
      });

      inject(function($injector, _$q_, _$rootScope_) {
        service = $injector.get('easyRTCService');
        $q = _$q_;
        $rootScope = _$rootScope_;
      });

      service.connect({ _id: 123 }, {}, []);
      expect(this.ioSocketConnection.connectCallback).to.be.a('function');
      this.ioSocketConnection.connectCallback();
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
