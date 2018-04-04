(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .controller('ContactSidebarController', ContactSidebarController);

  function ContactSidebarController(
    $scope,
    $q,
    _,
    userAPI,
    userUtils,
    contactAddressbookDisplayService,
    contactAddressbookService,
    CONTACT_ADDRESSBOOK_EVENTS
  ) {
    var self = this;
    var DISPLAY_SHELL_CONVERT_OPTIONS = {
      includeActions: true,
      includePriority: true
    };

    self.$onInit = $onInit;

    function $onInit() {
      contactAddressbookService.listAddressbooks()
        .then(_injectOwnerToSubscription)
        .then(function(addressbooks) {
          self.displayShells = contactAddressbookDisplayService.convertShellsToDisplayShells(addressbooks, DISPLAY_SHELL_CONVERT_OPTIONS);

          _refreshAddressbooksList();
        });

      $scope.$on(CONTACT_ADDRESSBOOK_EVENTS.CREATED, _onAddressbookCreatedEvent);
      $scope.$on(CONTACT_ADDRESSBOOK_EVENTS.UPDATED, _onUpdatedAddressbookEvent);
      $scope.$on(CONTACT_ADDRESSBOOK_EVENTS.DELETED, _onRemovedAddressbookEvent);
    }

    function _injectOwnerToSubscription(addressbooks) {
      var userIds = [];

      addressbooks.forEach(function(addressbook) {
        if (addressbook.isSubscription()) {
          userIds.push(addressbook.source.bookId);
        }
      });

      var getOwnersPromises = _.unique(userIds).map(function(userId) {
        return userAPI.user(userId).then(function(response) {
            return {
              id: userId,
              displayName: userUtils.displayNameOf(response.data)
            };
          });
      });

      return $q.all(getOwnersPromises).then(function(owners) {
        addressbooks.forEach(function(addressbook) {
          if (addressbook.isSubscription()) {
            var target = _.find(owners, function(owner) {
              return addressbook.source.bookId === owner.id;
            });

            if (target) {
              addressbook.owner = target;
            }
          }
        });

        return addressbooks;
      });
    }

    function _onAddressbookCreatedEvent(event, createdAddressbook) {
      self.displayShells.push(contactAddressbookDisplayService.convertShellToDisplayShell(createdAddressbook, DISPLAY_SHELL_CONVERT_OPTIONS));

      _refreshAddressbooksList();
    }

    function _onUpdatedAddressbookEvent(event, newAddressbook) {
      var index = _.findIndex(self.displayShells, function(addressbook) {
        return addressbook.shell.bookName === newAddressbook.bookName;
      });

      self.displayShells[index].shell = newAddressbook;
      self.displayShells[index].displayName = newAddressbook.name;

      _refreshAddressbooksList();
    }

    function _onRemovedAddressbookEvent(event, removedAddressbook) {
      _.remove(self.displayShells, function(addressbook) {
        return addressbook.shell.bookName === removedAddressbook.bookName;
      });

      _refreshAddressbooksList();
    }

    function _refreshAddressbooksList() {
      var categories = contactAddressbookDisplayService.categorizeDisplayShells(self.displayShells);

      self.userAddressbooks = categories.userAddressbooks;
      self.sharedAddressbooks = categories.sharedAddressbooks;
    }
  }
})(angular);
