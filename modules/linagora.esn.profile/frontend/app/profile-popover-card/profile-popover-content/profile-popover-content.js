(function(angular) {
  angular.module('linagora.esn.profile').component('profilePopoverContent', {
    templateUrl: '/profile/app/profile-popover-card/profile-popover-content/profile-popover-content.html',
    controller: function($state, touchscreenDetectorService) {
      var self = this;

      self.isMobileDevice = touchscreenDetectorService.hasTouchscreen();

      self.onProfileButtonClick = function(evt) {
        self._hideComponent(evt);
        $state.go('profile', {user_id: self.user.id});
      };

      self._hideComponent = function(evt) {
        evt.preventDefault();
        evt.stopPropagation();
        self.hideComponent();
      };
    },
    bindings: {
      user: '<',
      isCurrentUser: '<',
      hideComponent: '&'
    }
  });
})(angular);
