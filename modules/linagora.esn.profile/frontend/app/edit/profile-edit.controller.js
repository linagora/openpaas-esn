(function(angular) {
  'use strict';

  angular.module('linagora.esn.profile')
    .controller('profileEditController', profileEditController);

  function profileEditController($q, $state, _, session, profileAPI, asyncAction) {
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
      var promiseChain;
      var shouldReloadAfterUpdate = false;

      if (angular.equals(self.user, self.mutableUser)) {
        promiseChain = $q.when();
      } else {
        promiseChain = asyncAction(notificationMessages, function() {
          if (_isCurrentUser(self.mutableUser)) {
            return profileAPI.updateProfile(self.mutableUser).then(function() {
              session.setUser(self.mutableUser);
            });
          }

          shouldReloadAfterUpdate = true;

          return profileAPI.updateUserProfile(self.mutableUser, self.mutableUser._id, session.domain._id);
        });
      }

      return promiseChain
        .then(function() {
          $state.go(
            'profile',
            { user_id: _isCurrentUser(self.mutableUser) ? '' : self.mutableUser._id },
            { location: 'replace', reload: shouldReloadAfterUpdate }
          );
        });
    }

    function _isCurrentUser(user) {
      return user._id === session.user._id;
    }
  }

})(angular);
