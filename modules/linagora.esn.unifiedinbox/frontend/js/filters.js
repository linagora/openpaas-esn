'use strict';

angular.module('linagora.esn.unifiedinbox')

  .filter('trustAsHtml', function($sce) {
    return function(text) {
      return $sce.trustAsHtml(text);
    };
  });
