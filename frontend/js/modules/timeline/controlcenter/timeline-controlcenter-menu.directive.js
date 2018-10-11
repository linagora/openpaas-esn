(function(angular) {
  'use strict';

  angular.module('esn.timeline').directive('controlcenterMenuTimeline', controlcenterMenuTimeline);

  function controlcenterMenuTimeline(controlCenterMenuTemplateBuilder) {
    return {
      restrict: 'E',
      template: controlCenterMenuTemplateBuilder('controlcenter.timeline', 'mdi-timelapse', 'Timeline')
    };
  }
})(angular);
