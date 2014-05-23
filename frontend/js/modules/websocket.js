/*global io */

'use strict';

angular.module('esn.websocket', ['btford.socket-io', 'esn.session'])
  .factory('socket', ['socketFactory', 'session', function(socketFactory, session) {

    var sio = io.connect('', {
      query: 'token=' + session.token.token + '&user=' + session.user._id
    });

    sio.socket.on('error', function(reason) {
      console.error('Unable to connect to websocket', reason);
    });

    sio.on('connect', function() {
      console.info('WS Connection established with server');
    });

    sio.on('connecting', function() {
      console.info('Trying to connect to websocket');
    });

    sio.on('disconnect', function() {
      console.info('Disconnected from websocket');
    });

    return socketFactory({
      ioSocket: sio
    });
  }])
  .controller('livelogin', ['$scope', 'socket', function($scope, socket) {
    socket.on('user:login', function(data) {
      console.log('A user logged in', data.emails[0]);
    });
  }]);
