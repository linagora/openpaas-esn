'use strict';

/* global io */

angular.module('esn.socketio', []).factory('io', function() {
  return function() {
    return io;
  };
});
