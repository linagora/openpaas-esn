'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The websockets usernotification module', function() {
  var moduleToTest, localstub, globalstub, io;

  before(function() {
    moduleToTest = this.testEnv.basePath + '/backend/wsserver/notification/usernotifications';
  });

  beforeEach(function() {
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/community');
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/domain');

    localstub = {};
    globalstub = {};
    io = { of: function() { return this; } };
    this.helpers.mock.pubsub('../../core/pubsub', localstub, globalstub);
  });

  it('should not be initialized two times in a row', function() {
    var messageWarn = '';

    var loggerMocked = {
      warn: function(message) { messageWarn = message; return; }
    };

    mockery.registerMock('../../core/logger', loggerMocked);

    var module = require(moduleToTest);
    module.init({});
    module.init({});
    expect(messageWarn).to.equal('The user notifications event service is already initialized');
  });

  it('should subscribe to usernotification:created and usernotification:updated topic', function() {

    require(moduleToTest).init({});
    expect(globalstub.topics.length).to.equal(2);
    expect(globalstub.topics[0]).to.equal('usernotification:created');
    expect(globalstub.topics['usernotification:created'].handler).to.be.a.function;
    expect(globalstub.topics[1]).to.equal('usernotification:updated');
    expect(globalstub.topics['usernotification:updated'].handler).to.be.a.function;
  });

  describe('on notification event', function() {

    it('should get sockets for usernotification:created NS', function() {
      var call = 0;
      var socketHelper = {
        getUserSocketsFromNamespace: function() {
          call++;
          return [];
        }
      };
      mockery.registerMock('../helper/socketio', socketHelper);

      require(moduleToTest).init(io);

      var notif = {
        target: [
          { objectType: 'user', id: 1 },
          { objectType: 'user', id: 2 }
        ]
      };
      globalstub.topics['usernotification:created'].handler(notif);

      expect(call).to.equal(2);
    });

    it('should emit the proper notification on the retrieved sockets', function() {
      var emittedEvents1 = [];
      var emittedEvents2 = [];
      var emittedEvents3 = [];
      var socketHelper = {
        getUserSocketsFromNamespace: function(user) {
          if (user === 'user1') {
            var socket1 = {
              emit: function(event, payload) {
                expect(event).to.equal('created');
                emittedEvents1.push(payload);
              }
            };
            var socket2 = {
              emit: function(event, payload) {
                expect(event).to.equal('created');
                emittedEvents2.push(payload);
              }
            };
            return [socket1, socket2];
          } else if (user === 'user2') {
            var socket3 = {
              emit: function(event, payload) {
                expect(event).to.equal('created');
                emittedEvents3.push(payload);
              }
            };
            return [socket3];
          }
          return [];
        }
      };
      mockery.registerMock('../helper/socketio', socketHelper);

      require(moduleToTest).init(io);

      var notif = {
        target: [
          { objectType: 'user', id: 'user1' },
          { objectType: 'user', id: 'user2' },
          { objectType: 'user', id: 'user3' }
        ]
      };

      globalstub.topics['usernotification:created'].handler(notif);

      expect(emittedEvents1.length).to.equal(1);
      expect(emittedEvents1[0]).to.deep.equal(notif);
      expect(emittedEvents2.length).to.equal(1);
      expect(emittedEvents2[0]).to.deep.equal(notif);
      expect(emittedEvents3.length).to.equal(1);
      expect(emittedEvents3[0]).to.deep.equal(notif);
    });

    it('should emit to all community members if category is external', function() {

      var emittedEvents1 = [];
      var emittedEvents2 = [];
      var socketHelper = {
        getUserSocketsFromNamespace: function(user) {
          if (user === 'user1') {
            var socket1 = {
              emit: function(event, payload) {
                expect(event).to.equal('created');
                emittedEvents1.push(payload);
              }
            };
            return [socket1];
          } else if (user === 'user2') {
            var socket2 = {
              emit: function(event, payload) {
                expect(event).to.equal('created');
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
        getMembers: function(communityId, query, callback) {
          return callback(null, [
            {user: 'user1'}, {user: 'user2'}
          ]);
        }
      };
      mockery.registerMock('../../core/community', communityMock);

      require(moduleToTest).init(io);

      var notif = {
        target: [
          { objectType: 'community', id: 'community1' }
        ],
        category: 'external'
      };

      globalstub.topics['usernotification:created'].handler(notif);

      expect(emittedEvents1.length).to.equal(1);
      expect(emittedEvents1[0]).to.deep.equal(notif);
      expect(emittedEvents2.length).to.equal(1);
      expect(emittedEvents2[0]).to.deep.equal(notif);
    });

    it('should emit to all managers if category is community:membership:request', function() {

      var emittedEvents1 = [];
      var emittedEvents2 = [];
      var socketHelper = {
        getUserSocketsFromNamespace: function(user) {
          if (user === 'user1') {
            var socket1 = {
              emit: function(event, payload) {
                expect(event).to.equal('created');
                emittedEvents1.push(payload);
              }
            };
            return [socket1];
          } else if (user === 'user2') {
            var socket2 = {
              emit: function(event, payload) {
                expect(event).to.equal('created');
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
        getManagers: function(communityId, query, callback) {
          return callback(null, [
            {user: 'user1'}, {user: 'user2'}
          ]);
        }
      };
      mockery.registerMock('../../core/community', communityMock);

      require(moduleToTest).init(io);

      var notif = {
        target: [
          { objectType: 'community', id: 'community1' }
        ],
        category: 'community:membership:request'
      };

      globalstub.topics['usernotification:created'].handler(notif);

      expect(emittedEvents1.length).to.equal(1);
      expect(emittedEvents1[0]).to.deep.equal(notif);
      expect(emittedEvents2.length).to.equal(1);
      expect(emittedEvents2[0]).to.deep.equal(notif);
    });

    it('should emit once per sockets', function() {

      var emittedEvents1 = [];
      var emittedEvents2 = [];
      var socketHelper = {
        getUserSocketsFromNamespace: function(user) {
          if (user === 'user1') {
            var socket1 = {
              emit: function(event, payload) {
                expect(event).to.equal('created');
                emittedEvents1.push(payload);
              }
            };
            return [socket1];
          } else if (user === 'user2') {
            var socket2 = {
              emit: function(event, payload) {
                expect(event).to.equal('created');
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
        getMembers: function(communityId, query, callback) {
          return callback(null, [
            {user: 'user1'}
          ]);
        }
      };
      mockery.registerMock('../../core/community', communityMock);

      require(moduleToTest).init(io);

      var notif = {
        target: [
          { objectType: 'user', id: 'user1' },
          { objectType: 'community', id: 'community1' },
          { objectType: 'user', id: 'user2' }
        ],
        category: 'external'
      };
      globalstub.topics['usernotification:created'].handler(notif);

      expect(emittedEvents1.length).to.equal(1);
      expect(emittedEvents1[0]).to.deep.equal(notif);
      expect(emittedEvents2.length).to.equal(1);
      expect(emittedEvents2[0]).to.deep.equal(notif);
    });

  });
});
