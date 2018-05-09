(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .controller('contactAddressbookSharedRightDisplayController', addressbookSharedRightDisplayController);

  function addressbookSharedRightDisplayController(
    _,
    CONTACT_ADDRESSBOOK_PUBLIC_RIGHT,
    CONTACT_SHARING_SHARE_ACCESS_CHOICES
  ) {
    var self = this;

    self.$onInit = $onInit;

    function $onInit() {
      if (self.addressbook.rights.public) {
        self.displayRight = _.find(CONTACT_ADDRESSBOOK_PUBLIC_RIGHT, { value: self.addressbook.rights.public }).label;
      } else {
        self.displayRight = _.find(CONTACT_SHARING_SHARE_ACCESS_CHOICES, { value: self.addressbook.shareAccess }).label;
      }
    }
  }
})(angular);
