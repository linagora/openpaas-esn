(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .controller('ContactSidebarAddressbookItemController', ContactSidebarAddressbookItemController);

  function ContactSidebarAddressbookItemController() {
    var self = this;

    self.$onInit = $onInit;

    function $onInit() {
      self.actions = _getActions();
    }

    function _getActions() {
      if (!self.addressbookDisplayShell.actions || !self.addressbookDisplayShell.actions.length) {
        return [];
      }

      return self.addressbookDisplayShell.actions.filter(_isActionUsable);
    }

    function _isActionUsable(action) {
      var context = { addressbook: self.addressbookDisplayShell };

      return action.when(context);
    }
  }
})(angular);
