'use strict';

var expect = require('chai').expect,
  mockery = require('mockery');

describe('The webrtc server module', function() {

  it('should contains all needed properties.', function() {
    mockery.registerMock('../core/conference', {});

    var server = require(this.testEnv.basePath + '/backend/webrtc').webrtcserver;
    expect(server).to.exist;
    expect(server).to.be.an.Object;
    expect(server).to.have.property('pub');
    expect(server.pub).to.be.null;
    expect(server).to.have.property('started');
    expect(server.started).to.be.false;
    expect(server).to.have.property('start');
    expect(server.start).to.be.a.Function;
  });

  it('should not call easyrtc#listen when already started', function(done) {
    mockery.registerMock('easyrtc', {
      listen: function() {
        return done(new Error());
      }
    });

    mockery.registerMock('../core/conference', {});

    var server = require(this.testEnv.basePath + '/backend/webrtc').webrtcserver;
    server.started = true;
    server.start(null, null, function() {
      done();
    });
  });

  it('should not call easyrtc#listen when webserver is not defined', function(done) {
    mockery.registerMock('easyrtc', {
      listen: function() {
        return done(new Error());
      }
    });
    mockery.registerMock('../core/conference', {});

    var server = require(this.testEnv.basePath + '/backend/webrtc').webrtcserver;
    server.started = true;
    server.start(null, {}, function(err) {
      expect(err).to.be.defined;
      done();
    });
  });

  it('should not call easyrtc#listen when websocket server is not defined', function(done) {
    mockery.registerMock('easyrtc', {
      listen: function() {
        return done(new Error());
      }
    });
    mockery.registerMock('../core/conference', {});

    var server = require(this.testEnv.basePath + '/backend/webrtc').webrtcserver;
    server.started = true;
    server.start(null, {}, function(err) {
      expect(err).to.be.defined;
      done();
    });
  });

  it('should send back error when easyrtc#listen fails', function(done) {
    mockery.registerMock('easyrtc', {
      listen: function(web, ws, options, callback) {
        return callback(new Error());
      }
    });
    mockery.registerMock('../core/conference', {});

    var server = require(this.testEnv.basePath + '/backend/webrtc').webrtcserver;
    server.started = true;
    server.start({}, {}, function(err) {
      expect(err).to.be.defined;
      done();
    });
  });

  it('should be started when easyrtc#listen is ok', function(done) {
    mockery.registerMock('easyrtc', {
      listen: function(web, ws, options, callback) {
        return callback(null, {});
      }
    });
    mockery.registerMock('../core/conference', {});

    var server = require(this.testEnv.basePath + '/backend/webrtc').webrtcserver;
    server.started = true;
    server.start({}, {}, function(err) {
      expect(err).to.be.undefined;
      expect(server.started).to.be.true;
      done();
    });
  });

  it('should call conference.join when someone joins an easyrtc room', function(done) {
    var events = require('events');
    var eventEmitter = new events.EventEmitter();

    var pub = {
      events: {
        defaultListeners: {
          roomJoin: function(connectionObj, roomName, roomParameter, callback) {
            return callback();
          }
        }
      }
    };
    pub.events._eventListener = eventEmitter;
    pub.events.emit = pub.events._eventListener.emit.bind(pub.events._eventListener);

    mockery.registerMock('easyrtc', {
      listen: function(web, ws, options, callback) {
        return callback(null, pub);
      },
      events: pub.events._eventListener
    });
    mockery.registerMock('../core/conference', {
      join: function() {
        return done();
      }
    });

    var server = require(this.testEnv.basePath + '/backend/webrtc').webrtcserver;
    //server.started = true;
    server.start({}, {}, function(err) {
      expect(err).to.not.exist;
      eventEmitter.emit('roomJoin', {getUsername: function() {}}, 'myroom', {}, function() {
      });
    });
  });

  it('should call conference.leave when someone leaves an easyrtc room', function(done) {
    var events = require('events');
    var eventEmitter = new events.EventEmitter();

    var pub = {
      events: {
        defaultListeners: {
          roomLeave: function(connectionObj, roomName, next) {
            return next();
          }
        }
      }
    };
    pub.events._eventListener = eventEmitter;
    pub.events.emit = pub.events._eventListener.emit.bind(pub.events._eventListener);

    mockery.registerMock('easyrtc', {
      listen: function(web, ws, options, callback) {
        return callback(null, pub);
      },
      events: pub.events._eventListener
    });
    mockery.registerMock('../core/conference', {
      leave: function() {
        return done();
      }
    });

    var server = require(this.testEnv.basePath + '/backend/webrtc').webrtcserver;
    //server.started = true;
    server.start({}, {}, function(err) {
      expect(err).to.not.exist;
      eventEmitter.emit('roomLeave', {getUsername: function() {}}, 'myroom', {}, function() {
      });
    });
  });

  describe('The AwesomeWebRTCServer', function() {
    it('should provide a start state', function() {
      mockery.registerMock('../core/conference', {});
      var module = require(this.testEnv.basePath + '/backend/webrtc').awesomeWebRTCServer;
      expect(module.settings.start).to.exist;
      expect(module.settings.start).to.be.a('function');
    });
  });
});
