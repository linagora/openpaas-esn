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

       if (angular.equals(self.user, self.mutableUser)) {
        promiseChain = $q.when();
      } else {
        promiseChain = asyncAction(notificationMessages, function() {
          return profileAPI.updateProfile(self.mutableUser).then(function() {
            session.setUser(self.mutableUser);
          });
        });
      }

      return promiseChain
        .then(function() {
          $state.go('profile', {user_id: ''}, {location: 'replace'});
        });
    }
  }

})(angular);
