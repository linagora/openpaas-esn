(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .controller('ContactSidebarController', ContactSidebarController);

  function ContactSidebarController(ContactAPIClient, session) {
    var self = this;

    self.$onInit = $onInit;

    function $onInit() {
      ContactAPIClient.addressbookHome(session.user._id).addressbook().list()
        .then(function(addressbooks) {
          self.addressbooks = addressbooks;
        });
    }
  }
})(angular);
