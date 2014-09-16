/* global io */
'use strict';

angular.module('esn.socketio', []).factory('io', function() {
  return function() {
    return io;
  };
});
