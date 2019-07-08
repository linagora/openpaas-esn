(function(angular) {
  'use strict';

  angular.module('esn.profile-popover-card')
    .controller('profilePopoverContentController', profilePopoverContentController);

  function profilePopoverContentController($state, touchscreenDetectorService) {
    var self = this;

    self._hideComponent = _hideComponent;

    self.isMobileDevice = touchscreenDetectorService.hasTouchscreen();

    function _hideComponent(evt) {
      evt && evt.preventDefault();
      evt && evt.stopPropagation();
      self.hideComponent();
    }
  }
})(angular);
