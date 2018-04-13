(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .controller('contactAddressbookSharedRightDisplayController', addressbookSharedRightDisplayController);

  function addressbookSharedRightDisplayController(
    _,
    CONTACT_ADDRESSBOOK_PUBLIC_RIGHT
  ) {
    var self = this;

    self.$onInit = $onInit;

    function $onInit() {
      if (self.public) {
        self.displayRight = _.find(CONTACT_ADDRESSBOOK_PUBLIC_RIGHT, { value: self.public }).label;
      }
    }
  }
})(angular);
