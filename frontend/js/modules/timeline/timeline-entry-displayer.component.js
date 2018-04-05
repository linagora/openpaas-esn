(function(angular) {
  'use strict';

  angular.module('esn.timeline').component('esnTimelineEntryDisplayer', {
    bindings: {
      entry: '='
    },
    templateUrl: '/views/modules/timeline/timeline-entry-displayer.html'
  });

})(angular);
