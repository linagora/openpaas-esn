'use strict';

angular.module('linagora.esn.contact.twitter')
  .directive('showTwitterItem', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/contact.twitter/views/show-twitter-item.html'
    };
  });
