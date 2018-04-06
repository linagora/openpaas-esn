(function(angular) {
  'use strict';

  angular.module('esn.community').component('communityAbout', {
    bindings: {
      community: '='
    },
    templateUrl: '/views/modules/community/about/community-about.html'
  });
})(angular);
