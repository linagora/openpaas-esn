(function(angular) {
  'use strict';

  angular.module('esn.timeline').factory('esnTimelineAPI', esnTimelineAPI);

  function esnTimelineAPI(esnRestangular) {
    return {
      getUserTimelineEntries: getUserTimelineEntries
    };

    function getUserTimelineEntries(options) {
      return esnRestangular.all('timelineentries').getList(options);
    }
  }
})(angular);
