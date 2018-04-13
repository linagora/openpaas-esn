(function() {
  'use strict';

  angular.module('linagora.esn.contact')
    .component('contactAddressbookSettingsTabs', {
      templateUrl: '/contact/app/addressbook/settings/tabs/contact-addressbook-settings-tabs.html',
      bindings: {
        selectedTab: '='
      }
    });
})();
