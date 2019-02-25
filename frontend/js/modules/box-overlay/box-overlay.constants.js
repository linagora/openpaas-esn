(function(angular) {
  'use strict';

  angular.module('esn.box-overlay')
    .constant('ESN_BOX_OVERLAY_EVENTS', {
      RESIZED: 'esn:box-overlay:resized'
    })
    .constant('ESN_BOX_OVERLAY_MAX_WINDOWS', 20);

})(angular);
