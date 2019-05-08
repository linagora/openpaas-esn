(function(angular) {
  'use strict';

  angular.module('linagora.esn.profile')
    .controller('ProfileEditEmailController', ProfileEditEmailController);

  function ProfileEditEmailController(
    $q,
    session,
    esnAvailabilityService,
    emailService,
    userUtils
  ) {
    var self = this;

    self.$onInit = $onInit;
    self.onAddBtnClick = onAddBtnClick;
    self.checkEmailAvailability = checkEmailAvailability;
    self.onDeleteBtnClick = onDeleteBtnClick;
    self.canEdit = canEdit;
    self.emailValidator = emailValidator;

    function $onInit() {
      self.user.displayName = userUtils.displayNameOf(self.user);
      self.domainName = session.domain.name;
      self.removedEmails = [];
    }

    function canEdit() {
      return session.userIsDomainAdministrator();
    }

    function onAddBtnClick() {
      if (!self.newEmailLocalPart) {
        return;
      }

      var email = _buildEmail(self.newEmailLocalPart);

      self.user.emails.push(email);

      // If an email is removed in local but not yet on server
      // and it is added again then remove it in removed emails list in local
      var index = self.removedEmails.indexOf(email);

      if (index > -1) {
        self.removedEmails.splice(index, 1);
      }

      // Clear the new email local part input once success to add the new email
      self.newEmailLocalPart = '';
    }

    function onDeleteBtnClick(email, form) {
      var index = self.user.emails.indexOf(email);

      if (index > -1) {
        self.user.emails.splice(index, 1);
        self.removedEmails.push(email);
        form.$setDirty();
      }
    }

    function checkEmailAvailability(emailName) {
      if (!emailName) {
        return $q.when();
      }

      var email = _buildEmail(emailName);
      var isUsedByCurrentUser = self.user.emails.some(function(_email) { return _email === email; });

      if (isUsedByCurrentUser) {
        return $q.reject(new Error('Email is already in use by this user'));
      }

      // Allows to add the email which is removed in local but not yet on server
      if (self.removedEmails.indexOf(email) > -1) {
        return $q.when();
      }

      return esnAvailabilityService.checkEmailAvailability(email).then(function(data) {
        if (data && !data.available) {
          return $q.reject(new Error('Email is already in use by another user'));
        }
      });
    }

    function emailValidator(emailName) {
      if (!emailName) {
        return true;
      }

      return emailService.isValidEmail(_buildEmail(emailName));
    }

    function _buildEmail(emailName) {
      return [emailName, self.domainName].join('@');
    }
  }
})(angular);
