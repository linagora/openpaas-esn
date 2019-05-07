(function(angular) {
  'use strict';

  angular.module('linagora.esn.profile')
    .controller('ProfileEditEmailController', ProfileEditEmailController);

  function ProfileEditEmailController($q, session, esnAvailabilityService, userUtils) {
    var self = this;

    self.$onInit = $onInit;
    self.onAddBtnClick = onAddBtnClick;
    self.checkEmailAvailability = checkEmailAvailability;
    self.onDeleteBtnClick = onDeleteBtnClick;
    self.canEdit = canEdit;

    function $onInit() {
      self.user.displayName = userUtils.displayNameOf(self.user);
    }

    function canEdit() {
      return session.userIsDomainAdministrator();
    }

    function onAddBtnClick() {
      if (!self.newEmail) {
        return;
      }

      self.user.emails.push(self.newEmail);
      self.newEmail = '';
    }

    function onDeleteBtnClick(email, form) {
      var index = self.user.emails.indexOf(email);

      if (index > -1) {
        self.user.emails.splice(index, 1);
        form.$setDirty();
      }
    }

    function checkEmailAvailability(email) {
      if (!email) {
        return $q.when();
      }

      var isUsedByCurrentUser = self.user.emails.some(function(_email) { return _email === email; });

      if (isUsedByCurrentUser) {
        return $q.reject(new Error('Email is already in use by this user'));
      }

      return esnAvailabilityService.checkEmailAvailability(email).then(function(data) {
        if (data && !data.available) {
          return $q.reject(new Error('Email is already in use by another user'));
        }
      });
    }
  }
})(angular);
