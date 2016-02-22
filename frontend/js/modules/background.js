'use strict';

angular.module('esn.background', [])
  .service('backgroundProcessorService', function() {

    var tasks = [];

    function add(task) {
      if (!task) {
        return;
      }

      tasks.push(task);

      task.finally(function() {
        tasks.splice(tasks.indexOf(task), 1);
      });

      return task;
    }

    return {
      add: add,
      tasks: tasks
    };
  })

  .factory('inBackground', function(backgroundProcessorService) {
    return function(task) {
      return backgroundProcessorService.add(task);
    };
  });
