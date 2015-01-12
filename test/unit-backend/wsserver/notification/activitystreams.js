'use strict';

var expect = require('chai').expect;

describe('The WebSockets Event module', function() {
  var moduleToTest;

  before(function() {
    moduleToTest = this.testEnv.basePath + '/backend/wsserver/notification/activitystreams';
  });

  it('not be initialized two times in a row', function() {
    var called = 0;

    var io = {
      use: function() {},
      of: function() { return this; },
      on: function() { called++; return; }
    };

    this.helpers.mock.pubsub('../../core/pubsub', {}, {});

    var module = require(moduleToTest);
    module.init(io);
    module.init(io);
    expect(called).to.equal(1);
  });

  it('should subscribe to *:activity global topics', function(done) {
    var localstub = {};
    var globalstub = {};

    this.helpers.mock.pubsub('../../core/pubsub', localstub, globalstub);

    var io = {
      use: function() {},
      of: function() {
        expect(globalstub.topics.length).to.equal(1);
        expect(globalstub.topics[0]).to.equal('message:activity');
        expect(globalstub.topics['message:activity'].handler).to.be.a.function;
        return this;
      },
      on: function() {
        done();
      }
    };

    require(moduleToTest).init(io);
  });

  it('should notify with correct uuids in each room uuid in /activitystreams', function() {
    var localstub = {};
    var globalstub = {};
    var namespaceToTest = {};
    var emitToTest = {};
    var inToTest = [];

    this.helpers.mock.pubsub('../../core/pubsub', localstub, globalstub);

    var msg = {
      target: [
        {
          objectType: 'NOT GOOD',
          _id: 1
        },
        {
          objectType: 'activitystream',
          _id: 2
        },
        {
          objectType: 'activitystream',
          _id: 3
        }
      ]
    };

    var io = {
      use: function() {},
      of: function(namespace) {
        namespaceToTest = namespace;
        return this;
      },
      emit: function(event) {
        emitToTest = event;
        return this;
      },
      on: function() {
        return;
      }
    };
    io.in = function(room) {
      inToTest.push(room);
      return this;
    };

    require(moduleToTest).init(io);

    globalstub.topics['message:activity'].handler(msg);
    expect(namespaceToTest).to.equal('/activitystreams');
    expect(inToTest.length).to.equal(2);
    expect(inToTest[0]).to.equal(2);
    expect(inToTest[1]).to.equal(3);
    expect(emitToTest).to.equal('notification');
  });

  it('should open a websocket connection in /activitystreams', function(done) {
    var localstub = {};
    var globalstub = {};

    this.helpers.mock.pubsub('../../core/pubsub', localstub, globalstub);

    var io = {
      use: function() {},
      of: function(namespace) {
        expect(namespace).to.equal('/activitystreams');
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
      request: {},
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
      use: function() {},
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
