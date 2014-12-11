'use strict';

var async = require('async');

exports.init = function(grunt) {
  var exports = {};
  var children = [];

  exports.runWithForce = function(tasks) {
    return function() {
      var done = this.async();
      var taskmap = {};
      for (var i = 0; i < tasks.length; i++) {
        taskmap[tasks[i]] = 0;
      }

      function runTask(task, next) {
        var child = grunt.util.spawn({
          grunt: true,
          args: [task],
          opts: { stdio: 'inherit' }
        }, function(err, result, code) {
          taskmap[task] = code;
          next();
        });
        children.push(child);
      }

      async.series(Object.keys(taskmap).map(function(task) {
        return runTask.bind(null, task);
      }).concat([function(cb) {
        for (var k in taskmap) {
          if (taskmap[k] != 0) {
            grunt.fail.warn('Task ' + k + ' failed.', taskmap[k]);
            break;
          }
        }
        cb();
      }, done]));
    };
  };

  process.on('SIGINT', function() {
    children.forEach(function(child) {
      child.kill('SIGKILL');
    });
  });

  return exports;
};
