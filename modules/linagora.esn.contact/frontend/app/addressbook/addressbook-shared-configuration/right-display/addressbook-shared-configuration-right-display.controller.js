(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .controller('contactAddressbookSharedRightDisplayController', addressbookSharedRightDisplayController);

  function addressbookSharedRightDisplayController(
    _,
    CONTACT_ADDRESSBOOK_PUBLIC_RIGHT,
    CONTACT_SHARING_SHARE_ACCESS_CHOICES,
    CONTACT_SHARING_SUBSCRIPTION_TYPE
  ) {
    var self = this;

    self.$onInit = $onInit;

    function $onInit() {
      if (self.addressbook.subscriptionType === CONTACT_SHARING_SUBSCRIPTION_TYPE.delegation) {
        self.displayRight = _.find(CONTACT_SHARING_SHARE_ACCESS_CHOICES, { value: self.addressbook.shareAccess }).label;
      } else {
        self.displayRight = _.find(CONTACT_ADDRESSBOOK_PUBLIC_RIGHT, { value: self.addressbook.rights.public }).label;
      }
    }
  }
})(angular);
