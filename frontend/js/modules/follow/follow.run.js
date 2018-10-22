(function(angular) {
  'use strict';

  angular.module('esn.follow').run(runBlock);

  function runBlock(esnTimelineEntryProviders, FOLLOW_LINK_TYPE, UNFOLLOW_LINK_TYPE) {
    esnTimelineEntryProviders.register({
      verb: FOLLOW_LINK_TYPE,
      templateUrl: '/views/modules/follow/timeline/follow.html',
      canHandle: function() {
        return true;
      }
    });

    esnTimelineEntryProviders.register({
      verb: UNFOLLOW_LINK_TYPE,
      templateUrl: '/views/modules/follow/timeline/unfollow.html',
      canHandle: function() {
        return true;
      }
    });
  }

})(angular);
