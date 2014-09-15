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

  describe.only('IoAction service', function() {
    beforeEach(function() {
      var self = this;
      angular.mock.module('esn.websocket');
      angular.mock.module(function($provide) {
        $provide.value('$timeout', function() {});
      });

      angular.mock.inject(function(IoAction) {
        self.IoAction = IoAction;
      });

    });

    it('should be a function', function() {
      expect(this.IoAction).to.be.a.function;
    });

    it('should have default settings set to null', function() {
      var ioa = new this.IoAction();
      ['message', 'broadcast', 'namespace', 'subscription', 'removeListenerRequest', 'ngMessage', 'ngSubscription'].forEach(function(p) {
        expect(ioa).to.have.property(p);
        expect(ioa[p]).to.be.null;
      });
    });

    it('should upgrade default settings with options passed in arguments', function() {
      var opts = {
        message: 'message',
        broadcast: 'broadcast',
        namespace: 'namespace',
        subscription: 'subscription',
        removeListenerRequest: 'removeListenerRequest',
        ngMessage: 'ngMessage',
        ngSubscription: 'ngSubscription'
      };
      var ioa = new this.IoAction(opts);
      expect(ioa.message).to.equal('message');
      expect(ioa.broadcast).to.equal('broadcast');
      expect(ioa.namespace).to.equal('namespace');
      expect(ioa.subscription).to.equal('subscription');
      expect(ioa.removeListenerRequest).to.equal('removeListenerRequest');
      expect(ioa.ngMessage).to.equal('ngMessage');
      expect(ioa.ngSubscription).to.equal('ngSubscription');
    });

    describe('isSubscription method()', function() {
      it('should return true if the action is a subscription', function() {
        var opts = { subscription: 'subscription' };
        var ioa = new this.IoAction(opts);
        expect(ioa.isSubscription()).to.be.true;
      });
      it('should return false if the action is not a subscription', function() {
        var opts = { subscription: false };
        var ioa = new this.IoAction(opts);
        expect(ioa.isSubscription()).to.be.false;
      });
    });

    describe('isUnsubscribe method()', function() {
      it('should return true if the action got a removeListenerRequest property', function() {
        var opts = { removeListenerRequest: 'subscription' };
        var ioa = new this.IoAction(opts);
        expect(ioa.isUnsubscribe()).to.be.true;
      });
      it('should return false if the action does not have a removeListenerRequest property', function() {
        var ioa = new this.IoAction();
        expect(ioa.isUnsubscribe()).to.be.false;
      });
    });

    describe('equalsSubscription method()', function() {
      it('should return false if the two IoActions does not have the same namespaces', function() {
        var opts1 = { namespace: 'namespace1' };
        var opts2 = { namespace: 'namespace2' };
        var ioa1 = new this.IoAction(opts1);
        var ioa2 = new this.IoAction(opts2);
        expect(ioa1.equalsSubscription(ioa2)).to.be.false;
      });
      it('should return false if one IoAction have a namespace, and not the other', function() {
        var opts1 = { namespace: 'namespace1' };
        var opts2 = { };
        var ioa1 = new this.IoAction(opts1);
        var ioa2 = new this.IoAction(opts2);
        expect(ioa1.equalsSubscription(ioa2)).to.be.false;
      });
      it('should return false if the two IoAction does not have the same subscriptions data', function() {
        var opts1 = { namespace: 'namespace1', subscription: [1, 2] };
        var opts2 = { namespace: 'namespace1', subscription: [1, 3] };
        var ioa1 = new this.IoAction(opts1);
        var ioa2 = new this.IoAction(opts2);
        expect(ioa1.equalsSubscription(ioa2)).to.be.false;
      });
      it('should return true if the two IoAction have the same namespaces and the same subscriptions data', function() {
        var opts1 = { namespace: 'namespace1', subscription: [1, 2] };
        var opts2 = { namespace: 'namespace1', subscription: [1, 2] };
        var ioa1 = new this.IoAction(opts1);
        var ioa2 = new this.IoAction(opts2);
        expect(ioa1.equalsSubscription(ioa2)).to.be.true;
      });
      it('should return true if the two IoAction have no namespaces and the same subscriptions data', function() {
        var opts1 = { subscription: [1, 2] };
        var opts2 = { subscription: [1, 2] };
        var ioa1 = new this.IoAction(opts1);
        var ioa2 = new this.IoAction(opts2);
        expect(ioa1.equalsSubscription(ioa2)).to.be.true;
      });
    });

    describe('on() method', function() {
      it('should fill the subscription array with the on method arguments', function() {
        var ioa = new this.IoAction();
        ioa.on('one', 'two');
        expect(ioa.subscription).to.be.an.array;
        expect(ioa.subscription).to.have.length(2);
        expect(ioa.subscription).to.deep.equal(['one', 'two']);
      });
      describe('with a non function as the second argument', function() {
        it('should fill the ngSubscription property with the same values as the subscription property', function() {
          var ioa = new this.IoAction();
          ioa.on('one', 'two');
          expect(ioa.ngSubscription).to.deep.equal(['one', 'two']);
          expect(ioa.ngSubscription).to.deep.equal(ioa.subscription);
        });
      });
      describe('with a function as the second argument', function() {
        it('should fill the ngSubscription property with another function', function() {
          var ioa = new this.IoAction();
          var fn = function() {};
          ioa.on('one', fn);
          expect(ioa.ngSubscription).to.have.length(2);
          expect(ioa.ngSubscription[0]).to.equal('one');
          var same = (ioa.ngSubscription[1] === fn);
          expect(same).to.be.false;
        });
      });
    });

    describe('emit() method', function() {
      it('should fill the message array with the on method arguments', function() {
        var ioa = new this.IoAction();
        ioa.emit('one', 'two', 'three');
        expect(ioa.message).to.be.an.array;
        expect(ioa.message).to.have.length(3);
        expect(ioa.message).to.deep.equal(['one', 'two', 'three']);
      });
      describe('with a non function as the last argument', function() {
        it('should fill the ngMessage property with the same values as the message property', function() {
          var ioa = new this.IoAction();
          ioa.emit('one', 'two', 'three');
          expect(ioa.ngMessage).to.deep.equal(['one', 'two', 'three']);
          expect(ioa.ngMessage).to.deep.equal(ioa.message);
        });
      });
      describe('with a function as the last argument', function() {
        it('should fill the message property with another function', function() {
          var ioa = new this.IoAction();
          var fn = function() {};
          ioa.emit('one', 'two', 'three', fn);
          expect(ioa.ngMessage).to.have.length(4);
          expect(ioa.ngMessage[0]).to.equal('one');
          expect(ioa.ngMessage[1]).to.equal('two');
          expect(ioa.ngMessage[2]).to.equal('three');
          expect(ioa.ngMessage[3]).to.be.a.function;
          var same = (ioa.ngMessage[1] === fn);
          expect(same).to.be.false;
        });
      });
    });

    describe('of() method', function() {
      it('should fill the namespace property', function() {
        var ioa = new this.IoAction();
        expect(ioa.namespace).to.be.null;
        ioa.of('ns1');
        expect(ioa.namespace).to.equal('ns1');
      });
    });

    describe('removeListener() method', function() {
      it('should set subscription property with method arguments', function() {
        var ioa = new this.IoAction();
        ioa.removeListener('one', 'two');
        expect(ioa.subscription).to.deep.equal(['one', 'two']);
      });
      it('should set removeListenerRequest property to true', function() {
        var ioa = new this.IoAction();
        expect(ioa.removeListenerRequest).to.not.be.ok;
        ioa.removeListener('one', 'two');
        expect(ioa.removeListenerRequest).to.be.true;
      });
    });

    describe('applyToSocketIO() method', function() {
      describe('message style IoAction', function() {
        it('should propagate namespace and broadcast properties to socketIO', function() {
          var ns = null, broadcast = false;
          var sioMock = {
            of: function(namespace) {
              ns = namespace;
              var r = {
                broadcast: {
                  emit: function(evt, data) {
                    broadcast = true;
                  }
                }
              };
              return r;
            }
          };

          var ioa = new this.IoAction({namespace: 'ns1', broadcast: true});
          ioa.emit('one', 'two');
          ioa.applyToSocketIO(sioMock);
          expect(ns).to.equal('ns1');
          expect(broadcast).to.be.true;
        });
        it('should call socketIO emit method', function() {
          var event = null, data = false;
          var sioMock = {
            of: function(namespace) {
              var r = {
                broadcast: {
                  emit: function(e, d) {
                    event = e;
                    data = d;
                  }
                }
              };
              return r;
            }
          };

          var ioa = new this.IoAction({namespace: 'ns1', broadcast: true});
          ioa.emit('one', 'two');
          ioa.applyToSocketIO(sioMock);
          expect(event).to.equal('one');
          expect(data).to.equal('two');
        });
      });
      describe('subscription style IoAction', function() {
        it('should propagate namespace and broadcast properties to socketIO', function() {
          var ns = null, broadcast = false;
          var sioMock = {
            of: function(namespace) {
              ns = namespace;
              var r = {
                broadcast: {
                  on: function(evt, data) {
                    broadcast = true;
                  }
                }
              };
              return r;
            }
          };

          var ioa = new this.IoAction({namespace: 'ns1', broadcast: true});
          ioa.on('one', 'two');
          ioa.applyToSocketIO(sioMock);
          expect(ns).to.equal('ns1');
          expect(broadcast).to.be.true;
        });
        it('should call socketIO on method', function() {
          var event = null, data = false;
          var sioMock = {
            of: function(namespace) {
              var r = {
                broadcast: {
                  on: function(e, d) {
                    event = e;
                    data = d;
                  }
                }
              };
              return r;
            }
          };

          var ioa = new this.IoAction({namespace: 'ns1', broadcast: true});
          ioa.on('one', 'two');
          ioa.applyToSocketIO(sioMock);
          expect(event).to.equal('one');
          expect(data).to.equal('two');
        });
      });
      describe('unsubscription style IoAction', function() {
        it('should call SocketIO removeListener with the ioOfflineBuffer buffered action', function() {
          var event, data;
          var sioMock = {
            removeListener: function(e, d) {
              event = e;
              data = d;
            }
          };
          var ioOfflineBufferMock = {
            findSubscription: function() {
              return {
                ngSubscription: ['buffer1', 'buffer2']
              };
            }
          };
          var ioa = new this.IoAction();
          ioa.removeListener('one', 'two');
          ioa.applyToSocketIO(sioMock, ioOfflineBufferMock);
          expect(event).to.equal('buffer1');
          expect(data).to.equal('buffer2');
        });
      });
    });
  });
});
