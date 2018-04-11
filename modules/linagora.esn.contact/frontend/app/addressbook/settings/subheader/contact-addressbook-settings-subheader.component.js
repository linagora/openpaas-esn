(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .component('contactAddressbookSettingsSubheader', {
      templateUrl: '/contact/app/addressbook/settings/subheader/contact-addressbook-settings-subheader.html',
      bindings: {
        name: '<',
        onSubmit: '&',
        onCancel: '&',
        form: '<'
      }
    });
})(angular);
