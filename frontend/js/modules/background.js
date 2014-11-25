'use strict';

angular.module('esn.background', [])
  .service('backgroundProcessorService', ['$log', '$q', function($log, $q) {

    var tasks = [];

    function add(task, done, fail) {
      if (!task) {
        return;
      }

      done = done || function(result) {
        $log.info('Task is done', result);
      };

      fail = fail || function(err) {
        $log.info('Task error', err);
      };

      var promise = $q.when(task).then(done, fail).finally (function() {
        tasks.splice(tasks.indexOf(task), 1);
      });

      tasks.push(task);
      var defer = $q.defer();
      $q.when(promise).then(defer.resolve, defer.reject);
      return defer.promise;
    }

    return {
      add: add,
      tasks: tasks
    };
  }]);
