/* global io */

'use strict';

angular.module('esn.websocket', ['btford.socket-io', 'esn.session'])
  .factory('socket', ['$log', 'socketFactory', 'session', function($log, socketFactory, session) {
    return function(namespace) {
      var sio = io.connect(namespace || '', {
        query: 'token=' + session.token.token + '&user=' + session.user._id
      });

      sio.socket.on('error', function(reason) {
        $log.error('Unable to connect to websocket', reason);
      });

      sio.on('connect', function() {
        $log.info('WS Connection established with server');
      });

      sio.on('connecting', function() {
        $log.info('Trying to connect to websocket');
      });

      sio.on('disconnect', function() {
        $log.info('Disconnected from websocket');
      });

      var socket = socketFactory({
        ioSocket: sio
      });
      socket.socket = sio;
      return socket;
    };
  }])
  .factory('socketIORoom', ['$log', function($log) {

    return function(namespace, room, client) {
      var subscriptions = {};
      var nbEventSubscribed = 0;

      function isCallbackRegistered(event, callback) {
        if (!subscriptions[event] || !subscriptions[event].callbacks) {
          return false;
        }
        return subscriptions[event].callbacks.some(function(element) {
          return element === callback;
        });
      }

      return {
        on: function(event, callback) {
          if (! room) {
            client.on(event, callback);
            $log.debug(namespace + ' : subscribed');
            return this;
          }

          if (nbEventSubscribed === 0) {
            client.emit('subscribe', room);
            $log.debug(namespace + ' : subscribed to room', room);
          }

          function filterEvent(eventWrap) {
            if (eventWrap.room && eventWrap.room === room) {
              subscriptions[event].callbacks.forEach(function(element) {
                $log.debug('New', event, 'of namespace', namespace, 'in room', room, 'with data', eventWrap.data);
                element(eventWrap.data);
              });
            }
          }

          if (subscriptions[event] && !isCallbackRegistered(event, callback)) {
            subscriptions[event].callbacks.push(callback);
          } else {
            subscriptions[event] = {
              filterEvent: filterEvent,
              callbacks: [callback]
            };
            client.on(event, filterEvent);
            nbEventSubscribed++;
          }
          return this;
        },
        removeListener: function(event, callback) {
          if (! room) {
            client.removeListener(event, callback);
            $log.debug(namespace + ' : unsubscribed');
            return this;
          }
          if (! subscriptions[event]) {
            return this;
          }
          subscriptions[event].callbacks = subscriptions[event].callbacks.filter(function(element) {
            return element !== callback;
          });
          if (subscriptions[event].callbacks.length === 0) {
            client.removeListener(event, subscriptions[event].filterEvent);
            delete subscriptions[event];
            nbEventSubscribed--;
          }
          if (nbEventSubscribed === 0) {
            client.emit('unsubscribe', room);
            $log.debug(namespace + ' : unsubscribed to room', room);
          }
        }
      };
    };
  }])
  .factory('livenotification', ['$log', 'socket', 'socketIORoom', function($log, socket, socketIORoom) {
    var socketCache = {};

    /*
     * With room:
     * livenotification(namespace, room).on(event, callback);
     * livenotification(namespace, room).removeListener(event, callback);
     *
     * Without room:
     * livenotification(namespace).on(event, callback);
     * livenotification(namespace).removeListener(event, callback);
     */
    return function(namespace, room) {
      if (! socketCache[namespace + '/' + room]) {
        socketCache[namespace + '/' + room] = socketIORoom(namespace, room, socket(namespace));
      }
      return socketCache[namespace + '/' + room];
    };
}]);
