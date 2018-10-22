(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact').factory('ContactUserDisplayShell', ContactUserDisplayShell);

  function ContactUserDisplayShell(ContactDisplayShell, $state) {
    var UserDisplayShell = function(shell) {
      var self = this;

      if (shell) {
        this.shell = shell;
        this.overlayIcon = { iconClasses: 'mdi-account' };
        this.dropDownMenuDirective = 'virtual-user-menu-items';
        this.informationsToDisplay = [];

        if (this.shell.emails && this.shell.emails.length) {
          this.shell.emails.forEach(function(email) {
            self.informationsToDisplay.push({
              objectType: 'email',
              id: email.value,
              icon: 'mdi-email-outline',
              action: 'mailto:' + email.value
            });
          });
        }

        if (this.shell.tel && this.shell.tel.length) {
          this.shell.tel.forEach(function(phone) {
            self.informationsToDisplay.push({
              objectType: 'phone',
              id: phone.value,
              icon: 'mdi-phone',
              action: 'tel:' + phone.value
            });
          });
        }
      }
    };

    UserDisplayShell.prototype = new ContactDisplayShell();

    UserDisplayShell.prototype.getAvatar = function() {
      return '/api/users/' + this.shell.id + '/profile/avatar';
    };

    UserDisplayShell.prototype.displayContact = function() {
      $state.go('profile', { user_id: this.shell.id });
    };

    UserDisplayShell.prototype.getDisplayName = function() {
      return this.shell.displayName;
    };

    return UserDisplayShell;
  }
})(angular);
