(function(angular) {
  'use strict';

  angular.module('linagora.esn.profile')
    .controller('profileEditController', profileEditController);

  function profileEditController(
    $q,
    $state,
    esnConfigApi,
    _,
    session,
    userAPI,
    profileAPI,
    asyncAction
  ) {
    var self = this;
    var notificationMessages = {
      progressing: 'Updating profile...',
      success: 'Profile updated',
      failure: 'Error while updating your profile, please retry later'
    };
    var BASIC_FIELDS = [
      'firstname',
      'lastname',
      'job_title',
      'service',
      'building_location',
      'office_location',
      'main_phone',
      'description'
    ];

    self.$onInit = $onInit;
    self.onSaveBtnClick = onSaveBtnClick;

    function $onInit() {
      self.mutableUser = _.cloneDeep(self.user);

      canEditEmails().then(function(canEdit) {
        self.canEditEmails = canEdit;
      });
    }

    function canEditEmails() {
      if (!session.userIsDomainAdministrator()) return $q.when(false);

      return esnConfigApi.getDomainConfigurations(session.domain._id, [{
        name: 'core',
        keys: ['allowDomainAdminToManageUserEmails']
      }]).then(function(config) {
        return config && config[0] && config[0].configurations &&
          config[0].configurations[0] && config[0].configurations[0].value;
      });
    }

    function onSaveBtnClick() {
      return asyncAction(notificationMessages, _updateProfile);
    }

    function _updateProfile() {
      var promiseChain;
      var shouldReloadAfterUpdate = false;

      if (angular.equals(self.user, self.mutableUser)) {
        promiseChain = $q.when();
      } else {
        shouldReloadAfterUpdate = true;

        promiseChain = $q.all([
          _updateBasicInfo(),
          _updateEmails()
        ]);
      }

      return promiseChain
        .then(function() {
          if (_isCurrentUser(self.mutableUser)) {
            session.setUser(self.mutableUser);
          }

          $state.go(
            'profile',
            { user_id: _isCurrentUser(self.mutableUser) ? '' : self.mutableUser._id },
            { location: 'replace', reload: shouldReloadAfterUpdate }
          );
        });
    }

    function _updateBasicInfo() {
      if (!_isModified(BASIC_FIELDS)) {
        return $q.when();
      }

      if (_isCurrentUser(self.mutableUser)) {
        return profileAPI.updateProfile(self.mutableUser);
      }

      return profileAPI.updateUserProfile(self.mutableUser, self.mutableUser._id, session.domain._id);
    }

    function _updateEmails() {
      if (!_isModified(['emails'])) {
        return $q.when();
      }

      return userAPI.setUserEmails(self.mutableUser._id, self.mutableUser.emails, session.domain._id);
    }

    function _isModified(fields) {
      return !angular.equals(_.pick(self.user, fields), _.pick(self.mutableUser, fields));
    }

    function _isCurrentUser(user) {
      return user._id === session.user._id;
    }
  }

})(angular);
