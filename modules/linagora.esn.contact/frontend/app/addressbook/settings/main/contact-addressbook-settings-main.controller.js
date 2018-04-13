(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .controller('contactAddressbookSettingsMainController', contactAddressbookSettingsMainController);

  function contactAddressbookSettingsMainController(
    CONTACT_ADDRESSBOOK_PUBLIC_RIGHT
  ) {
    var self = this;

    self.$onInit = $onInit;
    self.canUpdatePublicRight = canUpdatePublicRight;

    function $onInit() {
      self.publicRights = Object.keys(CONTACT_ADDRESSBOOK_PUBLIC_RIGHT).map(function(right) {
        return {
          value: CONTACT_ADDRESSBOOK_PUBLIC_RIGHT[right].value,
          title: CONTACT_ADDRESSBOOK_PUBLIC_RIGHT[right].longLabel
        };
      });
    }

    function canUpdatePublicRight() {
      return !self.addressbook.isSubscription;
    }
  }
})(angular);
