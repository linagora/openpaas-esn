(function(angular) {
  'use strict';

  angular.module('esn.search', [
    'esn.application-menu',
    'esn.lodash-wrapper',
    'esn.aggregator',
    'esn.provider',
    'op.dynamicDirective',
    'angularMoment',
    'esn.i18n',
    'ui.router',
    'material.components.select',
    'material.components.panel'
  ]);

})(angular);
