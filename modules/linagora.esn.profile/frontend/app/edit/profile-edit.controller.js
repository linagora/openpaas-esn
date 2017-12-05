(function(angular) {
  'use strict';

  angular.module('linagora.esn.profile')
    .controller('profileEditController', profileEditController);

  function profileEditController($state, _, session, profileAPI, asyncAction, rejectWithErrorNotification) {
    var self = this;
    var notificationMessages = {
      progressing: 'Updating profile...',
      success: 'Profile updated',
      failure: 'Error while updating your profile, please retry later'
    };

    self.$onInit = $onInit;
    self.updateProfile = updateProfile;

    function $onInit() {
      self.mutableUser = _.cloneDeep(self.user);
    }

    function updateProfile() {
      if (angular.equals(self.user, self.mutableUser)) {
        return rejectWithErrorNotification('You did not modify anything');
      }

      return asyncAction(notificationMessages, function() {
        return profileAPI.updateProfile(self.mutableUser).then(function() {
          session.setUser(self.mutableUser);
          $state.go('profile', { user_id: '' });
        });
      });
    }
  }

})(angular);
