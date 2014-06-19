'use strict';

var expect = require('chai').expect,
    mockery = require('mockery');

describe('The WebSockets server module', function() {

  beforeEach(function(done) {
    this.testEnv.initCore(done);
    mockery.registerMock('./events', function() {});
  });

  it('should contains all needed properties.', function() {
    var wsserver = require(this.testEnv.basePath + '/backend/wsserver');
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
    var serverInstance = null;
    var fixturesPath = null;

    var getExpressMock = function() {
      var expressMock = require(fixturesPath + '/express').express();
      expressMock.constructorResponse.listen = function(serverPort) {
        return serverInstance;
      };
      return expressMock;
    };

    before(function() {
      serverInstance = {
        me: true,
        on: function(event, callback) {
          if (event === 'listening') {
            process.nextTick(callback);
          }
        },
        removeListener: function() {}
      };
      fixturesPath = this.testEnv.fixtures;
    });

    describe('when webserver port and wsserver port are different', function() {

      it('should call socket.io listen with a new express server', function(done) {

        var port = require(this.testEnv.basePath + '/backend/core').config('default').wsserver.port;
        require(this.testEnv.basePath + '/backend/core').config('default').webserver.port = (port + 1);

        var ioMock = {
          listen: function(target) {
            expect(target).to.be.an.Object;
            expect(target).to.equal(serverInstance);
            done();
          }
        };

        var expressMock = getExpressMock();

        mockery.registerMock('./middleware/setup-sessions', function() {});
        mockery.registerMock('socket.io', ioMock);
        mockery.registerMock('express', expressMock);

        var wsserver = require(this.testEnv.basePath + '/backend/wsserver');

        wsserver.start(function() {});
      });
    });

    describe('when webserver port and wsserver port are equal', function() {

      it('should call socket.io listen with the express server as an argument', function(done) {

        var port = require(this.testEnv.basePath + '/backend/core').config('default').wsserver.port;
        require(this.testEnv.basePath + '/backend/core').config('default').webserver.port = port;

        var ioMock = {
          listen: function(target) {
            expect(wsserver.server).to.equal(webserver.server);
            expect(target).to.equal(webserver.server);
            return done();
          }
        };

        var expressMock = getExpressMock();

        mockery.registerMock('./middleware/setup-sessions', function() {});
        mockery.registerMock('socket.io', ioMock);
        mockery.registerMock('express', expressMock);

        var wsserver = require(this.testEnv.basePath + '/backend/wsserver');
        var webserver = require(this.testEnv.basePath + '/backend/webserver');

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

      mockery.registerMock('./middleware/setup-sessions', function() {});
      mockery.registerMock('socket.io', ioMock);

      var wsserver = require(this.testEnv.basePath + '/backend/wsserver');

      wsserver.start(function() {done();});
    });

  });

  describe('socket.io instance', function() {
    it('should add user on socket connection', function(done) {
      var events = require('events');
      var eventEmitter = new events.EventEmitter();

      var ioMock = {
        listen: function() {
          return {
            configure: function() {
            },
            set: function() {
            },
            sockets: eventEmitter
          };
        }
      };

      mockery.registerMock('./middleware/setup-sessions', function() {});
      mockery.registerMock('socket.io', ioMock);

      var wsserver = require(this.testEnv.basePath + '/backend/wsserver');
      var store = require(this.testEnv.basePath + '/backend/wsserver/socketstore');
      wsserver.start(function() {
        var socket = {
          id: 'socket1',
          handshake: {
            user: '123'
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
      var eventEmitter = new events.EventEmitter();
      var util = require('util');

      function Socket(handshake) {
        this.handshake = handshake;
        events.EventEmitter.call(this);
      }
      util.inherits(Socket, events.EventEmitter);

      var ioMock = {
        listen: function() {
          return {
            configure: function() {
            },
            set: function() {
            },
            sockets: eventEmitter
          };
        }
      };

      mockery.registerMock('./middleware/setup-sessions', function() {});
      mockery.registerMock('socket.io', ioMock);

      var wsserver = require(this.testEnv.basePath + '/backend/wsserver');
      var store = require(this.testEnv.basePath + '/backend/wsserver/socketstore');
      wsserver.start(function() {
        var socket = new Socket({user: '123'});
        socket.id = 'socket1';
        eventEmitter.emit('connection', socket);

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
});
