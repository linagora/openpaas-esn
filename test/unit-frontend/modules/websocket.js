'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esn.websocket Angular module', function() {

  var handlerSubscribe, handlerUnsubscribe;

  var namespace1 = 'ns1',
    namespace2 = 'ns2',
    room1 = 'room1',
    room2 = 'room2',
    event = 'event';

  var socketIOClientMock = {
    /**
     * namespaces = {
     *  "namespace": {
     *    callbacks: []
     *  }
     * }
     */
    namespaces: {},
    connect: function(namespace) {
      socketIOClientMock.namespaces[namespace] = {
        callbacks: []
      };
      return {
        emit: function(event, data) {
          if (event === 'subscribe' && handlerSubscribe) {
            handlerSubscribe(data);
          }
          if (event === 'unsubscribe' && handlerUnsubscribe) {
            handlerUnsubscribe(data);
          }
        },
        on: function(event, callback) {
          socketIOClientMock.namespaces[namespace].callbacks.push(callback);
        },
        removeListener: function(event, callback) {
          socketIOClientMock.namespaces[namespace].callbacks =
            socketIOClientMock.namespaces[namespace].callbacks.filter(function(element) {
              return element !== callback;
          });
        }
      };
    }
  };

  var socketIOServerMock = {
    of: function(namespace) {
      return {
        to: function(room) {
          return {
            emit: function(event, data) {
              if (! socketIOClientMock.namespaces[namespace] ||
                ! socketIOClientMock.namespaces[namespace].callbacks) {
                return;
              }
              socketIOClientMock.namespaces[namespace].callbacks.forEach(function(callback) {
                callback({room: room, data: data});
              });
            }
          };
        }
      };
    }
  };

  afterEach(function() {
    socketIOClientMock.namespaces = {};
    handlerSubscribe = null;
    handlerUnsubscribe = null;
  });

  describe('socketIORoom service', function() {
    beforeEach(function() {
      var asLog = {
        debug: function() {}
      };

      angular.mock.module('esn.websocket');
      angular.mock.module(function($provide) {
        $provide.value('$log', asLog);
      });
    });

    beforeEach(inject(function(socketIORoom) {
      this.socketIORoom = socketIORoom;
    }));

    it('should have needed function', function() {
      expect(this.socketIORoom).to.be.a.function;
      expect(this.socketIORoom().on).to.be.a.function;
      expect(this.socketIORoom().removeListener).to.be.a.function;
    });

    describe('on() method', function() {
      it('should emit "subscribe" for the first "on()"', function(done) {
        handlerSubscribe = function() {
          done();
        };

        var socketIORoom = this.socketIORoom(namespace1, room1, socketIOClientMock.connect(namespace1));
        socketIORoom.on(event, function() {});
        socketIORoom.on(event, function() {});
      });

      it('should execute the handler', function(done) {
        var socketIORoom = this.socketIORoom(namespace1, room1, socketIOClientMock.connect(namespace1));

        function handler(data) {
          expect(data).to.exist;
          expect(data).to.deep.equal({content: 'test'});
          done();
        }

        socketIORoom.on(event, handler);
        socketIOServerMock.of(namespace1).to(room1).emit(event, {content: 'test'});
      });

      it('should execute only one handler', function(done) {
        var sio = socketIOClientMock.connect(namespace1);
        var socketIORoom = this.socketIORoom(namespace1, room1, sio);
        function handler(data) {
          expect(data).to.exist;
          expect(data).to.deep.equal({content: 'test'});
          // Wait to see if the second handler is called
          setTimeout(function() {
            done();
          }, 100);
        }
        socketIORoom.on(event, handler);

        var socketIORoom2 = this.socketIORoom(namespace1, room2, sio);
        function handler2(data) {
          done(new Error('Test should not pass here !'));
        }
        socketIORoom2.on(event, handler2);

        socketIOServerMock.of(namespace1).to(room1).emit(event, {content: 'test'});
      });

      it('should not execute the handler', function(done) {
        var socketIORoom = this.socketIORoom(namespace1, room1, socketIOClientMock.connect(namespace1));
        function handler(data) {
          done(new Error('Test should not pass here !'));
        }
        socketIORoom.on(event, handler);

        socketIOServerMock.of(namespace1).to(room2).emit(event, {content: 'test'});
        socketIOServerMock.of(namespace2).to(room1).emit(event, {content: 'test'});
        socketIOServerMock.of(namespace2).to(room2).emit(event, {content: 'test'});
        // Wait to see if the second handler is called
        setTimeout(function() {
          done();
        }, 100);
      });

      it('should execute the handlers', function(done) {
        var verifHandlerExecuted = {
          handler: false,
          handler2: false
        };
        function isHandlerExecuted() {
          if (verifHandlerExecuted.handler && verifHandlerExecuted.handler2) {
            done();
          }
        }

        var socketIORoom = this.socketIORoom(namespace1, room1, socketIOClientMock.connect(namespace1));
        function handler(data) {
          expect(data).to.exist;
          expect(data).to.deep.equal({content: 'test'});
          verifHandlerExecuted.handler = true;
          isHandlerExecuted();
        }
        socketIORoom.on(event, handler);

        function handler2(data) {
          expect(data).to.exist;
          expect(data).to.deep.equal({content: 'test'});
          verifHandlerExecuted.handler2 = true;
          isHandlerExecuted();
        }
        socketIORoom.on(event, handler2);

        socketIOServerMock.of(namespace1).to(room1).emit(event, {content: 'test'});
      });
    });

    describe('removeListener() method', function() {
      it('should do nothing if the callback does not exist', function(done) {
        var socketIORoom = this.socketIORoom(namespace1, room1, socketIOClientMock.connect(namespace1));
        function handler(data) {
          done(new Error('Test should not pass here !'));
        }
        socketIORoom.removeListener(event, handler);
        expect(socketIOClientMock.namespaces[namespace1].callbacks.length).to.equal(0);
        done();
      });

      it('should remove the handler and emit "unsubscribe" when the last handler is removed', function(done) {
        handlerUnsubscribe = function() {
          // Wait to see if the handler is called
          setTimeout(function() {
            done();
          }, 100);
        };

        var socketIORoom = this.socketIORoom(namespace1, room1, socketIOClientMock.connect(namespace1));
        function handler(data) {
          done(new Error('Test should not pass here !'));
        }
        socketIORoom.on(event, handler);
        expect(socketIOClientMock.namespaces[namespace1].callbacks.length).to.equal(1);
        socketIORoom.removeListener(event, handler);
        expect(socketIOClientMock.namespaces[namespace1].callbacks.length).to.equal(0);

        socketIOServerMock.of(namespace1).to(room1).emit(event, {content: 'test'});
      });
    });
  });

  describe('livenotification service', function() {
    beforeEach(function() {
      var asLog = {
        debug: function() {}
      };

      var asSocket = function(namespace) {
        return socketIOClientMock.connect(namespace);
      };

      angular.mock.module('esn.websocket');
      angular.mock.module(function($provide) {
        $provide.value('$log', asLog);
        $provide.value('socket', asSocket);
      });
    });

    beforeEach(inject(function(livenotification) {
      this.livenotification = livenotification;
    }));

    it('should have needed function', function() {
      expect(this.livenotification).to.be.a.function;
      expect(this.livenotification().on).to.be.a.function;
      expect(this.livenotification().removeListener).to.be.a.function;
    });
  });
});
