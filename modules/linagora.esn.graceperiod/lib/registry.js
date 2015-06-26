'use strict';

var q = require('q');

module.exports = function() {

  var tasks = {};

  function put(id, task) {
    if (!id) {
      return q.reject(new Error('ID is required'));
    }

    if (!task) {
      return q.reject(new Error('Task is required'));
    }

    tasks[id] = task;
    return q();
  }

  function get(id) {
    return q(tasks[id]);
  }

  function remove(id) {
    delete tasks[id];
    return q();
  }

  return {
    put: put,
    get: get,
    remove: remove
  };

};
