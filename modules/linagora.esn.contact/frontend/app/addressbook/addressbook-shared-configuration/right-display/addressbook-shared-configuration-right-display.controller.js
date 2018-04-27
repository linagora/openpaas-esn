(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .controller('contactAddressbookSharedRightDisplayController', addressbookSharedRightDisplayController);

  function addressbookSharedRightDisplayController(
    _,
    CONTACT_ADDRESSBOOK_PUBLIC_RIGHT,
    CONTACT_SHARING_SHARE_ACCESS
  ) {
    var self = this;

    self.$onInit = $onInit;

    function $onInit() {
      if (self.addressbook.rights.public) {
        self.displayRight = _.find(CONTACT_ADDRESSBOOK_PUBLIC_RIGHT, { value: self.addressbook.rights.public }).label;
      } else {
        switch (self.addressbook.shareAccess) {
          case CONTACT_SHARING_SHARE_ACCESS.READ:
            self.displayRight = 'Read';
            break;
          case CONTACT_SHARING_SHARE_ACCESS.READWRITE:
            self.displayRight = 'Read/Write';
            break;
          default:
            self.displayRight = 'Unknown';
        }
      }
    }
  }
})(angular);
