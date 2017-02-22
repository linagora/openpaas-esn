'use strict';

var expect = require('chai').expect,
    mockery = require('mockery'),
    sinon = require('sinon');

describe('The WebSockets server module', function() {

  var connectionTopic, disconnectionTopic, pubsub;

  beforeEach(function(done) {
    this.testEnv.initCore(done);
    // Do not remove this. ./events is required inside email-templates
    mockery.registerMock('email-templates', {});
    mockery.registerMock('./events', function() {});

    connectionTopic = {
      publish: sinon.spy()
    };

    disconnectionTopic = {
      publish: sinon.spy()
    };

    pubsub = {
      topic: sinon.spy(function(name) {
        return name === 'user:connection' ? connectionTopic : disconnectionTopic;
      })
    };

    mockery.registerMock('../core/pubsub/local', pubsub);
  });

  it('should contains all needed properties.', function() {
    var wsserver = this.helpers.requireBackend('wsserver').wsserver;
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

  describe('the cleanAllWebsockets function', function() {
    it('should call the store clean function', function() {
      const socketstore = {
        clean: sinon.spy()
      };

      mockery.registerMock('./socketstore', socketstore);

      const wsserver = this.helpers.requireBackend('wsserver').wsserver;

      wsserver.cleanAllWebsockets();

      expect(socketstore.clean).to.have.been.calledOnce;
    });
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

        var wsserver = this.helpers.requireBackend('wsserver').wsserver;

        wsserver.start(1234, function() {});
      });
    });

    describe('when webserver port and wsserver port are equal', function() {

      it('should call socket.io listen with the express server as an argument', function(done) {
        var wsserver;
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

        wsserver = this.helpers.requireBackend('wsserver').wsserver;

        wsserver.start(8080, function() {});
      });
    });

    describe('when webserver ssl_port and wsserver port are equal', function() {

      it('should call socket.io listen with the express sslserver as an argument', function(done) {
        var wsserver;
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

        wsserver = this.helpers.requireBackend('wsserver').wsserver;

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

      var wsserver = this.helpers.requireBackend('wsserver').wsserver;

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

      var wsserver = this.helpers.requireBackend('wsserver').wsserver;
      var store = this.helpers.requireBackend('wsserver/socketstore');
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

    it('should publish userId on user:connection channel on socket connection', function(done) {
      var events = require('events');
      var eventEmitter = new events.EventEmitter();
      eventEmitter.use = function() {};

      var ioMock = function() {
        return eventEmitter;
      };

      mockery.registerMock('./middleware/setup-sessions', function() {});
      mockery.registerMock('socket.io', ioMock);

      var wsserver = this.helpers.requireBackend('wsserver').wsserver;
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
          expect(pubsub.topic).to.have.been.calledWith('user:connection');
          expect(connectionTopic.publish).to.have.been.calledWith('123');
          done();
        });
      });
    });

    it('should publish userId on user:disconnection channel on socket disconnection', function(done) {
      var events = require('events');
      var eventEmitter = new events.EventEmitter();
      eventEmitter.use = function() {};

      var ioMock = function() {
        return eventEmitter;
      };

      mockery.registerMock('./middleware/setup-sessions', function() {});
      mockery.registerMock('socket.io', ioMock);

      var wsserver = this.helpers.requireBackend('wsserver').wsserver;
      wsserver.start(function() {
        var socket = {
          id: 'socket1',
          request: {
            userId: '123'
          },
          on: sinon.spy()
        };
        eventEmitter.emit('connection', socket);

        process.nextTick(function() {
          expect(socket.on).to.have.been.calledWith('disconnect', sinon.match(function(callback) {
            callback();
            expect(pubsub.topic).to.have.been.calledWith('user:disconnection');
            expect(disconnectionTopic.publish).to.have.been.calledWith('123');
            return true;
          }));
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

      var wsserver = this.helpers.requireBackend('wsserver').wsserver;
      var store = this.helpers.requireBackend('wsserver/socketstore');
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
      var module = this.helpers.requireBackend('wsserver').awesomeWsServer;
      expect(module.settings.states.start).to.exist;
      expect(module.settings.states.start).to.be.a('function');
    });
  });

});
