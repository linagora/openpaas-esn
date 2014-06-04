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

      return socketFactory({
        ioSocket: sio
      });
    };
  }])
  .controller('livelogin', ['$scope', '$log', 'session', function($scope, $log, socket) {
    socket().on('user:login', function(data) {
      $log.log('A user logged in', data.emails[0]);
    });
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
        return this;
      },
      subscribe: function(uuid, callback) {
        $log.log(this.namespace + ' : subscribed to room', uuid);
        this.notification.emit('subscribe', uuid);
        if (callback) {
          callback();
        }
        return this;
      },
      unsubscribe: function(uuid, callback) {
        $log.log(this.namespace + ' : unsubscribed to room', uuid);
        this.notification.emit('unsubscribe', uuid);
        if (callback) {
          callback();
        }
      },
      onNotification: function(callback) {
        this.notification.on('notification', function (data) {
          $log.log('New notification', data);
          callback(data);
        });
      }
    };
  }]);
