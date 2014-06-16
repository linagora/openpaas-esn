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
  .factory('livenotification', ['$log', 'session', 'socket', function($log, session, socket) {
    /*
     * livenotification.of(namespace).subscribe(room, callback).onNotification(callback);
     * livenotification.of(namespace).unsubscribe(room, callback);
     */
    return {
      of: function(namespace) {
        var notification = socket(namespace, {
          query: 'token=' + session.token.token + '&user=' + session.user._id
        });
        this.notification = notification;
        this.namespace = namespace;
        return this;
      },
      subscribe: function(uuid) {
        $log.debug(this.namespace + ' : subscribed to room', uuid);
        this.notification.emit('subscribe', uuid);
        this.room = uuid;
        return this;
      },
      unsubscribe: function(uuid) {
        $log.debug(this.namespace + ' : unsubscribed to room', uuid);
        this.notification.emit('unsubscribe', uuid);
      },
      onNotification: function(callback) {
        var self = this;
        this.notification.on('notification', function(data) {
          $log.debug('New notification', data, 'in', self.room || self.namespace);
          callback(data);
        });
      },
      on: function(event, callback) {
        this.notification.on(event, function(data) {
          $log.debug('New message', data, 'on', event);
          callback(data);
        });
      }
    };
  }]);
