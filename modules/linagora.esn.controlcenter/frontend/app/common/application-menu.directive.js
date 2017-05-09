'use strict';

angular.module('linagora.esn.controlcenter')

.directive('controlcenterApplicationMenu', function(applicationMenuTemplateBuilder) {
  return {
    retrict: 'E',
    replace: true,
    template: applicationMenuTemplateBuilder('/#/controlcenter', { url: '/controlcenter/images/control-center-icon.svg' }, 'Control Center')
  };
});
