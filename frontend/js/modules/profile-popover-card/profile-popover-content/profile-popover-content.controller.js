(function(angular) {
  'use strict';

  angular.module('esn.profile-popover-card').controller('profilePopoverContentController', profilePopoverContentController);
  function profilePopoverContentController($state, touchscreenDetectorService) {
    var self = this;

    self.isMobileDevice = touchscreenDetectorService.hasTouchscreen();

    self.onProfileButtonClick = function(evt) {
      self._hideComponent(evt);
      $state.go('profile', {user_id: self.user._id});
    };

    self._hideComponent = function(evt) {
      evt && evt.preventDefault();
      evt && evt.stopPropagation();
      self.hideComponent();
    };
  }
})(angular);
