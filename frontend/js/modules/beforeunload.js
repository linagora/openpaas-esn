'use strict';

angular.module('esn.beforeunload', ['esn.background'])

  .run(function($window, backgroundProcessorService) {
    //https://developer.mozilla.org/en-US/docs/Web/Events/beforeunload
    $window.addEventListener('beforeunload', function(event) {
      var numberBackgroundTasks = backgroundProcessorService.tasks.length;
      if (numberBackgroundTasks) {
        var msg = numberBackgroundTasks +
              (numberBackgroundTasks > 1 ? ' background tasks are running' : ' background task is running') +
              '. Are you sure want to leave OpenPaas?';
        event.returnValue = msg; // Gecko, Trident, Chrome 34+
        return msg; // Gecko, WebKit, Chrome <34
      }
    });
  });
