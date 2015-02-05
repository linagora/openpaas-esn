'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The websockets usernotification module', function() {
  var moduleToTest, localstub, globalstub, io;

  before(function() {
    moduleToTest = this.testEnv.basePath + '/backend/wsserver/notification/usernotifications';
  });

  beforeEach(function() {
    this.helpers.requireBackend('core/db/mongo/models/community');
    this.helpers.requireBackend('core/db/mongo/models/domain');
    this.helpers.requireBackend('core/db/mongo/models/usernotification');

    localstub = {};
    globalstub = {};
    io = {
      of: function() { return this; },
      on: function() {}
    };
    this.helpers.mock.pubsub('../../core/pubsub', localstub, globalstub);
  });

  it('should not be initialized two times in a row', function() {
    var messageWarn = '';

    var loggerMocked = {
      warn: function(message) { messageWarn = message; return; }
    };

    mockery.registerMock('../../core/logger', loggerMocked);

    var module = require(moduleToTest);
    module.init(io);
    module.init(io);
    expect(messageWarn).to.equal('The user notifications event service is already initialized');
  });

  it('should subscribe to usernotification:created and usernotification:updated topic', function() {

    require(moduleToTest).init(io);
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
        target: '123'
      };
      globalstub.topics['usernotification:created'].handler(notif);

      expect(call).to.equal(1);
    });

    it('should emit the proper notification on the retrieved socket', function() {
      var emittedEvents1 = [];
      var emittedEvents2 = [];
      var emittedEvents3 = [];
      var testUserId = '123';
      var socketHelper = {
        getUserSocketsFromNamespace: function(userId) {
          if (userId === testUserId) {
            var socket1 = {
              emit: function(event, payload) {
                expect(event).to.equal('usernotification:created');
                emittedEvents1.push(payload);
              }
            };
            var socket2 = {
              emit: function(event, payload) {
                expect(event).to.equal('usernotification:created');
                emittedEvents2.push(payload);
              }
            };
            return [socket1, socket2];
          } else {
            var socket3 = {
              emit: function(event, payload) {
                expect(event).to.equal('usernotification:created');
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
        target: testUserId
      };

      globalstub.topics['usernotification:created'].handler(notif);

      expect(emittedEvents1.length).to.equal(1);
      expect(emittedEvents1[0]).to.deep.equal(notif);
      expect(emittedEvents2.length).to.equal(1);
      expect(emittedEvents2[0]).to.deep.equal(notif);
      expect(emittedEvents3.length).to.equal(0);
    });

  });
});
