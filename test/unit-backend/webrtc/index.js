'use strict';

var expect = require('chai').expect,
  mockery = require('mockery');

describe('The webrtc server module', function() {

  it('should contains all needed properties.', function() {
    var server = require(this.testEnv.basePath + '/backend/webrtc');
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

    var server = require(this.testEnv.basePath + '/backend/webrtc');
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

    var server = require(this.testEnv.basePath + '/backend/webrtc');
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

    var server = require(this.testEnv.basePath + '/backend/webrtc');
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

    var server = require(this.testEnv.basePath + '/backend/webrtc');
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

    var server = require(this.testEnv.basePath + '/backend/webrtc');
    server.started = true;
    server.start({}, {}, function(err) {
      expect(err).to.be.undefined;
      expect(server.started).to.be.true;
      done();
    });
  });
});
