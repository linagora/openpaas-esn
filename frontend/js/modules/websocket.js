/*global io */

'use strict';

angular.module('esn.websocket', ['btford.socket-io', 'esn.session'])
  .factory('socket', ['$log', 'socketFactory', 'session', function($log, socketFactory, session) {

    var sio = io.connect('', {
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
  }])
  .controller('livelogin', ['$scope', '$log', 'socket', function($scope, $log, socket) {
    socket.on('user:login', function(data) {
      $log.log('A user logged in', data.emails[0]);
    });
  }]);
