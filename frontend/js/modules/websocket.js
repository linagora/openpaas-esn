'use strict';

angular.module('esn.websocket', ['btford.socket-io'])
  .factory('socket', function(socketFactory) {

    var sio = io.connect();
    sio.socket.on('error', function (reason){
      console.error('Unable to connect to websocket', reason);
    });

    sio.on('connect', function (){
      console.info('WS Connection established with server');
    });

    return socketFactory({
      ioSocket: sio
    });
  });