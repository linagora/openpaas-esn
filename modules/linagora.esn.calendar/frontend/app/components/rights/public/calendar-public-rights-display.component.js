(function() {
  'use strict';

  angular.module('esn.calendar')
    .component('calPublicRightsDisplay', {
      bindings: {
        right: '<'
      },
      controller: 'CalPublicRightsDisplayController',
      template: '<span>{{::$ctrl.humanReadable}}</span>'
    });
})();
