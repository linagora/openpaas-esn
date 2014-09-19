'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The WebSockets notification module', function() {
  var moduleToTest;

  before(function() {
    moduleToTest = this.testEnv.basePath + '/backend/wsserver/notification/notifications';
  });

  beforeEach(function() {
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/community');
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/domain');
  });

  describe('init method', function() {

    it('should not be initialized two times in a row', function() {
      var called = 0;

      var io = {
        of: function() { return this; },
        on: function() { called++; return; }
      };

      this.helpers.mock.pubsub('../../core/pubsub', {}, {});

      var module = require(moduleToTest);
      module.init(io);
      module.init(io);
      expect(called).to.equal(1);
    });

    it('should subscribe to notification:api topic', function(done) {
      var localstub = {};
      var globalstub = {};

      this.helpers.mock.pubsub('../../core/pubsub', localstub, globalstub);

      var io = {
        of: function() {
          expect(globalstub.topics.length).to.equal(1);
          expect(globalstub.topics[0]).to.equal('notification:api');
          expect(globalstub.topics['notification:api'].handler).to.be.a.function;
          return this;
        },
        on: function() {
          done();
        }
      };

      require(moduleToTest).init(io);
    });

    it('should open a websocket connection in /notifications', function(done) {
      var localstub = {};
      var globalstub = {};

      this.helpers.mock.pubsub('../../core/pubsub', localstub, globalstub);

      var io = {
        of: function(namespace) {
          expect(namespace).to.equal('/notifications');
          return this;
        },
        on: function() {
          done();
        }
      };

      require(moduleToTest).init(io);
    });

    it('should call join on "connection" on "subscribe"', function() {
      var localstub = {};
      var globalstub = {};
      var eventsToTest = [];
      var calledJoin = 0;
      var calledLeave = 0;

      this.helpers.mock.pubsub('../../core/pubsub', localstub, globalstub);

      var socket = {
        handshake: {
          query: {},
          address: {}
        },
        on: function(event, callback) {
          eventsToTest.push(event);
          callback(1234);
        },
        join: function(uuid) {
          expect(uuid).to.equal(1234);
          calledJoin++;
        },
        leave: function(uuid) {
          expect(uuid).to.equal(1234);
          calledLeave++;
        }
      };

      var io = {
        of: function() {
          return this;
        },
        on: function(event, callback) {
          expect(event).to.equal('connection');
          callback(socket);
        }
      };

      require(moduleToTest).init(io);

      expect(calledJoin).to.equal(1);
      expect(calledLeave).to.equal(1);
      expect(eventsToTest[0]).to.equal('subscribe');
      expect(eventsToTest[1]).to.equal('unsubscribe');
    });

  });

  describe('on notification event', function() {

    it('should get sockets for notification:api NS', function() {
      var localstub = {};
      var globalstub = {};
      this.helpers.mock.pubsub('../../core/pubsub', localstub, globalstub);

      var call = 0;
      var socketHelper = {
        getUserSocketsFromNamespace: function() {
          call++;
          return [];
        }
      };
      mockery.registerMock('../helper/socketio', socketHelper);

      var io = {
        of: function() { return this; },
        on: function() { }
      };
      require(moduleToTest).init(io);

      var notif = {
        target: [
          {
            objectType: 'user',
            id: 1
          },
          {
            objectType: 'user',
            id: 2
          }
        ]
      };
      globalstub.topics['notification:api'].handler(notif);

      expect(call).to.equal(2);
    });


    it('should emit the proper notification on the retrieved sockets', function() {
      var localstub = {};
      var globalstub = {};
      this.helpers.mock.pubsub('../../core/pubsub', localstub, globalstub);

      var emittedEvents1 = [];
      var emittedEvents2 = [];
      var emittedEvents3 = [];
      var socketHelper = {
        getUserSocketsFromNamespace: function(user) {
          if (user === 'user1') {
            var socket1 = {
              emit: function(event, payload) {
                expect(event).to.equal('notification');
                emittedEvents1.push(payload);
              }
            };
            var socket2 = {
              emit: function(event, payload) {
                expect(event).to.equal('notification');
                emittedEvents2.push(payload);
              }
            };
            return [socket1, socket2];
          }
          else if (user === 'user2') {
            var socket3 = {
              emit: function(event, payload) {
                expect(event).to.equal('notification');
                emittedEvents3.push(payload);
              }
            };
            return [socket3];
          }
          return [];
        }
      };
      mockery.registerMock('../helper/socketio', socketHelper);

      var io = {
        of: function() { return this; },
        on: function() { }
      };
      require(moduleToTest).init(io);

      var notif = {
        target: [
          {
            objectType: 'user',
            id: 'user1'
          },
          {
            objectType: 'user',
            id: 'user2'
          },
          {
            objectType: 'user',
            id: 'user3'
          }
        ]
      };
      globalstub.topics['notification:api'].handler(notif);

      expect(emittedEvents1.length).to.equal(1);
      expect(emittedEvents1[0]).to.deep.equal(notif);
      expect(emittedEvents2.length).to.equal(1);
      expect(emittedEvents2[0]).to.deep.equal(notif);
      expect(emittedEvents3.length).to.equal(1);
      expect(emittedEvents3[0]).to.deep.equal(notif);
    });

    it('should emit to all community members', function() {
      var localstub = {};
      var globalstub = {};
      this.helpers.mock.pubsub('../../core/pubsub', localstub, globalstub);

      var emittedEvents1 = [];
      var emittedEvents2 = [];
      var socketHelper = {
        getUserSocketsFromNamespace: function(user) {
          if (user === 'user1') {
            var socket1 = {
              emit: function(event, payload) {
                expect(event).to.equal('notification');
                emittedEvents1.push(payload);
              }
            };
            return [socket1];
          }
          else if (user === 'user2') {
            var socket2 = {
              emit: function(event, payload) {
                expect(event).to.equal('notification');
                emittedEvents2.push(payload);
              }
            };
            return [socket2];
          }
          return [];
        }
      };
      mockery.registerMock('../helper/socketio', socketHelper);

      var communityMock = {
        getMembers: function(communityId, callback) {
          return callback(null, [
            {user: 'user1'}, {user: 'user2'}
          ]);
        }
      };
      mockery.registerMock('../../core/community', communityMock);

      var io = {
        of: function() { return this; },
        on: function() { }
      };
      require(moduleToTest).init(io);

      var notif = {
        target: [
          {
            objectType: 'community',
            id: 'community1'
          }
        ]
      };
      globalstub.topics['notification:api'].handler(notif);

      expect(emittedEvents1.length).to.equal(1);
      expect(emittedEvents1[0]).to.deep.equal(notif);
      expect(emittedEvents2.length).to.equal(1);
      expect(emittedEvents2[0]).to.deep.equal(notif);
    });

    it('should emit once per sockets', function() {
      var localstub = {};
      var globalstub = {};
      this.helpers.mock.pubsub('../../core/pubsub', localstub, globalstub);

      var emittedEvents1 = [];
      var emittedEvents2 = [];
      var socketHelper = {
        getUserSocketsFromNamespace: function(user) {
          if (user === 'user1') {
            var socket1 = {
              emit: function(event, payload) {
                expect(event).to.equal('notification');
                emittedEvents1.push(payload);
              }
            };
            return [socket1];
          }
          else if (user === 'user2') {
            var socket2 = {
              emit: function(event, payload) {
                expect(event).to.equal('notification');
                emittedEvents2.push(payload);
              }
            };
            return [socket2];
          }
          return [];
        }
      };
      mockery.registerMock('../helper/socketio', socketHelper);

      var communityMock = {
        getMembers: function(communityId, callback) {
          return callback(null, [
            {user: 'user1'}
          ]);
        }
      };
      mockery.registerMock('../../core/community', communityMock);

      var io = {
        of: function() { return this; },
        on: function() { }
      };
      require(moduleToTest).init(io);

      var notif = {
        target: [
          {
            objectType: 'user',
            id: 'user1'
          },
          {
            objectType: 'community',
            id: 'community1'
          },
          {
            objectType: 'user',
            id: 'user2'
          }
        ]
      };
      globalstub.topics['notification:api'].handler(notif);

      expect(emittedEvents1.length).to.equal(1);
      expect(emittedEvents1[0]).to.deep.equal(notif);
      expect(emittedEvents2.length).to.equal(1);
      expect(emittedEvents2[0]).to.deep.equal(notif);
    });

  });

});
