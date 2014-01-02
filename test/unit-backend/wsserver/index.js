'use strict';

var BASEPATH = '../../..';
var expect = require('chai').expect;
var mockery = require('mockery');

describe('The WebSockets server module', function() {

  it('should exist', function() {
    var wsserver = require(BASEPATH + '/backend/wsserver');
    expect(wsserver).to.exist;
  });

  it('should be an object', function() {
    var wsserver = require(BASEPATH + '/backend/wsserver');
    expect(wsserver).to.be.an.Object;
  });

  it('should have an namespaces property', function() {
    var wsserver = require(BASEPATH + '/backend/wsserver');
    expect(wsserver.namespaces).to.exist;
    expect(wsserver.namespaces).to.be.an.Array;
  });

  it('should have a server property', function() {
    var wsserver = require(BASEPATH + '/backend/wsserver');
    expect(wsserver).to.have.property('server');
    expect(wsserver.server).to.be.null;
  });

  it('should have a port property', function() {
    var wsserver = require(BASEPATH + '/backend/wsserver');
    expect(wsserver).to.have.property('port');
    expect(wsserver.port).to.be.null;
  });

  it('should have a started property', function() {
    var wsserver = require(BASEPATH + '/backend/wsserver');
    expect(wsserver).to.have.property('started');
    expect(wsserver.started).to.be.false;
  });

  it('should have a start property', function() {
    var wsserver = require(BASEPATH + '/backend/wsserver');
    expect(wsserver).to.have.property('start');
    expect(wsserver.start).to.be.a.Function;
  });

  describe('the start property', function() {

    describe('when webserver port and wsserver port are different', function() {

      it('should call socket.io listen with a new express server', function(done) {

        var port = require(BASEPATH + '/backend/core').config('default').wsserver.port;
        require(BASEPATH + '/backend/core').config('default').webserver.port = (port + 1);

        var ioMock = {
          listen: function(target) {
            expect(target).to.be.an.Object;
            expect(target).to.equal(serverInstance);
            done();
          }
        };

        var serverInstance = {
          me: true,
          on: function(event, callback) {
            if (event === 'listening') {
              process.nextTick(callback);
            }
          },
          removeListener: function() {}
        };

        var expressMock = function() {
          return {
            listen: function(serverPort) {
              return serverInstance;
            }
          };
        };

        mockery.registerMock('socket.io', ioMock);
        mockery.registerMock('express', expressMock);
        var wsserver = require(BASEPATH + '/backend/wsserver');

        wsserver.start(function() {});
      });
    });

    describe('when webserver port and wsserver port are equal', function() {

      it('should call socket.io listen with the express server as an argument', function(done) {

        var port = require(BASEPATH + '/backend/core').config('default').wsserver.port;
        require(BASEPATH + '/backend/core').config('default').webserver.port = port;

        var ioMock = {
          listen: function(target) {
            expect(wsserver.server).to.equal(webserver.server);
            expect(target).to.equal(webserver.server);
            done();
          }
        };

        var serverInstance = {
          me: true,
          on: function(event, callback) {
            if (event === 'listening') {
              process.nextTick(callback);
            }
          },
          removeListener: function() {}
        };

        var expressMock = function() {
          return {
            listen: function(serverPort) {
              return serverInstance;
            }
          };
        };

        mockery.registerMock('socket.io', ioMock);
        mockery.registerMock('express', expressMock);

        var wsserver = require(BASEPATH + '/backend/wsserver');
        var webserver = require(BASEPATH + '/backend/webserver');

        webserver.start(port, function() {
          wsserver.start(function() {});
        });
      });
    });

    it('should fire the callback when system is started', function(done) {
      var ioMock = {
        listen: function(target) {
        }
      };

      mockery.registerMock('socket.io', ioMock);

      var wsserver = require(BASEPATH + '/backend/wsserver');

      wsserver.start(function() {done();});
    });

  });
});
