'use strict';

angular.module('linagora.esn.unifiedinbox')

  .directive('inboxHeaderBackButton', function() {
    return {
      restrict: 'E',
      templateUrl: '/unifiedinbox/views/partials/header/back-button.html'
    };
  });
