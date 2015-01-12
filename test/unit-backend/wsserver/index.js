'use strict';

var expect = require('chai').expect,
    mockery = require('mockery');

describe('The WebSockets server module', function() {

  beforeEach(function(done) {
    this.testEnv.initCore(done);
    mockery.registerMock('./events', function() {});
  });

  it('should contains all needed properties.', function() {
    var wsserver = require(this.testEnv.basePath + '/backend/wsserver').wsserver;
    expect(wsserver).to.exist;
    expect(wsserver).to.be.an.Object;
    expect(wsserver.namespaces).to.exist;
    expect(wsserver.namespaces).to.be.an.Array;
    expect(wsserver).to.have.property('server');
    expect(wsserver.server).to.be.null;
    expect(wsserver).to.have.property('port');
    expect(wsserver.port).to.be.null;
    expect(wsserver).to.have.property('started');
    expect(wsserver.started).to.be.false;
    expect(wsserver).to.have.property('start');
    expect(wsserver.start).to.be.a.Function;
  });

  describe('the start property', function() {

    describe('when webserver port and wsserver port are different', function() {

      it('should call socket.io listen with a new express server', function(done) {

        var webserverMock = {
          webserver: {
            port: 8080
          }
        };

        var ioMock = function(target) {
          expect(target.name).to.equal('a new server');
          done();
        };

        var expressMock = function() {
          return {
            listen: function() {
              return {
                name: 'a new server',
                on: function() {}
              };
            }
          };
        };

        mockery.registerMock('socket.io', ioMock);
        mockery.registerMock('../webserver', webserverMock);
        mockery.registerMock('express', expressMock);

        var wsserver = require(this.testEnv.basePath + '/backend/wsserver').wsserver;

        wsserver.start(1234, function() {});
      });
    });

    describe('when webserver port and wsserver port are equal', function() {

      it('should call socket.io listen with the express server as an argument', function(done) {

        var webserverMock = {
          webserver: {
            port: 8080,
            server: 'sslserver'
          }
        };

        var ioMock = function(target) {
          expect(wsserver.server).to.equal(webserverMock.webserver.server);
          expect(target).to.equal(webserverMock.webserver.server);
          return done();
        };

        mockery.registerMock('socket.io', ioMock);
        mockery.registerMock('../webserver', webserverMock);

        var wsserver = require(this.testEnv.basePath + '/backend/wsserver').wsserver;

        wsserver.start(8080, function() {});
      });
    });

    describe('when webserver ssl_port and wsserver port are equal', function() {

      it('should call socket.io listen with the express sslserver as an argument', function(done) {

        var webserverMock = {
          webserver: {
            ssl_port: 443,
            sslserver: 'sslserver'
          }
        };

        var ioMock = function(target) {
          expect(wsserver.server).to.equal(webserverMock.webserver.sslserver);
          expect(target).to.equal(webserverMock.webserver.sslserver);
          return done();
        };

        mockery.registerMock('socket.io', ioMock);
        mockery.registerMock('../webserver', webserverMock);

        var wsserver = require(this.testEnv.basePath + '/backend/wsserver').wsserver;

        wsserver.start(443, function() {});
      });
    });

    it('should fire the callback when system is started', function(done) {
      var ioMock = function() {
        return {
          use: function() {},
          on: function() {}
        };
      };

      mockery.registerMock('./middleware/setup-sessions', function() {});
      mockery.registerMock('socket.io', ioMock);

      var wsserver = require(this.testEnv.basePath + '/backend/wsserver').wsserver;

      wsserver.start(function() {done();});
    });

  });

  describe('socket.io instance', function() {
    it('should add user on socket connection', function(done) {
      var events = require('events');
      var eventEmitter = new events.EventEmitter();
      eventEmitter.use = function() {};

      var ioMock = function() {
        return eventEmitter;
      };

      mockery.registerMock('./middleware/setup-sessions', function() {});
      mockery.registerMock('socket.io', ioMock);

      var wsserver = require(this.testEnv.basePath + '/backend/wsserver').wsserver;
      var store = require(this.testEnv.basePath + '/backend/wsserver/socketstore');
      wsserver.start(function() {
        var socket = {
          id: 'socket1',
          request: {
            userId: '123'
          },
          on: function() {
          }
        };
        eventEmitter.emit('connection', socket);

        process.nextTick(function() {
          var socks = store.getSocketsForUser('123');
          expect(socks).to.have.length(1);
          expect(socks[0]).to.deep.equal(socket);
          done();
        });
      });
    });

    it('should remove user on socket disconnect event', function(done) {
      var events = require('events');
      var ioEventEmitter = new events.EventEmitter();
      var util = require('util');

      function Socket(handshake) {
        this.request = handshake;
        events.EventEmitter.call(this);
      }
      util.inherits(Socket, events.EventEmitter);

      var ioMock = function() {
        ioEventEmitter.use = function() {};
        return ioEventEmitter;
      };

      mockery.registerMock('./middleware/setup-sessions', function() {});
      mockery.registerMock('socket.io', ioMock);

      var wsserver = require(this.testEnv.basePath + '/backend/wsserver').wsserver;
      var store = require(this.testEnv.basePath + '/backend/wsserver/socketstore');
      wsserver.start(function() {
        var socket = new Socket({userId: '123'});
        socket.id = 'socket1';
        ioEventEmitter.emit('connection', socket);

        process.nextTick(function() {
          socket.emit('disconnect');
          process.nextTick(function() {
            expect(store.getSocketsForUser('123')).to.have.length(0);
            done();
          });
        });
      });
    });
  });

  describe('AwesomeWsServer', function() {
    it('should provide a start state', function() {
      mockery.registerMock('./middleware/setup-sessions', function() {});
      mockery.registerMock('socket.io', function() {});
      var module = require(this.testEnv.basePath + '/backend/wsserver').awesomeWsServer;
      expect(module.settings.states.start).to.exist;
      expect(module.settings.states.start).to.be.a('function');
    });
  });

});
