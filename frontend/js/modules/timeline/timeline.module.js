(function(angular) {
  'use strict';

  angular.module('esn.timeline', [
    'op.dynamicDirective',
    'esn.http',
    'esn.infinite-list',
    'esn.provider',
    'esn.aggregator',
    'openpaas-logo',
    'esn.constants'
  ]);
})(angular);
