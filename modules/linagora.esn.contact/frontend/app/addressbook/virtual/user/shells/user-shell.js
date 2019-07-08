(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact').factory('ContactUserShell', ContactUserShell);

  function ContactUserShell(userUtils) {

    function Shell(user, addressbook) {
      this.id = user.id;
      this.firstName = user.firstname || '';
      this.lastName = user.lastname || '';
      this.displayName = userUtils.displayNameOf(user);
      this.addressbook = addressbook;
      this.org = '';
      this.orgName = '';
      this.orgRole = '';
      this.emails = [{ type: 'Work', value: user.preferredEmail }];
      this.objectType = user.objectType;

      if (user.main_phone) {
        this.tel = [{ type: 'Work', value: user.main_phone }];
      }

      this.addresses = [];
      this.social = [];
      this.urls = [];
    }

    return Shell;
  }
})(angular);
