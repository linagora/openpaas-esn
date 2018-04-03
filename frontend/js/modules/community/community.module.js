(function(angular) {
  'use strict';

  angular.module('esn.community', [
    'esn.activitystreams-tracker',
    'esn.session',
    'esn.user',
    'esn.avatar',
    'esn.http',
    'mgcrea.ngStrap.alert',
    'mgcrea.ngStrap.tooltip',
    'angularFileUpload',
    'esn.infinite-list',
    'openpaas-logo',
    'esn.object-type',
    'ngTagsInput',
    'esn.widget.helper',
    'esn.collaboration',
    'op.dynamicDirective',
    'esn.feature-registry',
    'esn.module-registry'
  ]);
})(angular);
