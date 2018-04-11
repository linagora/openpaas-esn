(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('contactAddressbookACLHelper', contactAddressbookACLHelper);

  function contactAddressbookACLHelper(
    session,
    contactAddressbookParser,
    DEFAULT_ADDRESSBOOK_NAME,
    CONTACT_COLLECTED_ADDRESSBOOK_NAME
  ) {
    var AVAILABLE_PRIVILEGES = {
      all: '{DAV:}all',
      write: '{DAV:}write',
      read: '{DAV:}read'
    };
    var AUTHENTICATED_USERS_PRINCIPAL = '{DAV:}authenticated';

    return {
      canEditAddressbook: canEditAddressbook,
      canDeleteAddressbook: canDeleteAddressbook,
      canCreateContact: canCreateContact,
      canEditContact: canEditContact,
      canCopyContact: canCopyContact,
      canMoveContact: canMoveContact,
      canDeleteContact: canDeleteContact
    };

    function canEditAddressbook(addressbookShell, userId) {
      if (_isDefaultAddressbook(addressbookShell)) {
        return false;
      }

      var userPrivileges = _getUserPrivileges(addressbookShell.acl, userId);

      return userPrivileges.indexOf(AVAILABLE_PRIVILEGES.all) !== -1 ||
        userPrivileges.indexOf(AVAILABLE_PRIVILEGES.write) !== -1;
    }

    function canDeleteAddressbook(addressbookShell, userId) {
      if (_isDefaultAddressbook(addressbookShell)) {
        return false;
      }

      var userPrivileges = _getUserPrivileges(addressbookShell.acl, userId);

      return userPrivileges.indexOf(AVAILABLE_PRIVILEGES.all) !== -1 ||
        userPrivileges.indexOf(AVAILABLE_PRIVILEGES.write) !== -1;
    }

    function canCreateContact(addressbookShell, userId) {
      var userPrivileges;

      if (addressbookShell.isSubscription) {
        userPrivileges = _getAuthenticatedUserPrivileges(addressbookShell.source.acl);
      } else {
        userPrivileges = _getUserPrivileges(addressbookShell.acl, userId);
      }

      return userPrivileges.indexOf(AVAILABLE_PRIVILEGES.all) !== -1 ||
        userPrivileges.indexOf(AVAILABLE_PRIVILEGES.write) !== -1;
    }

    function canEditContact(addressbookShell, userId) {
      var userPrivileges;

      if (addressbookShell.isSubscription) {
        userPrivileges = _getAuthenticatedUserPrivileges(addressbookShell.source.acl);
      } else {
        userPrivileges = _getUserPrivileges(addressbookShell.acl, userId);
      }

      return userPrivileges.indexOf(AVAILABLE_PRIVILEGES.all) !== -1 ||
        userPrivileges.indexOf(AVAILABLE_PRIVILEGES.write) !== -1;
    }

    function canCopyContact() {
      return true; // Now allows copy contact as default
    }

    function canMoveContact(addressbookShell, userId) {
      var userPrivileges;

      if (addressbookShell.isSubscription) {
        userPrivileges = _getAuthenticatedUserPrivileges(addressbookShell.source.acl);
      } else {
        userPrivileges = _getUserPrivileges(addressbookShell.acl, userId);
      }

      return userPrivileges.indexOf(AVAILABLE_PRIVILEGES.all) !== -1 ||
        userPrivileges.indexOf(AVAILABLE_PRIVILEGES.write) !== -1;
    }

    function canDeleteContact(addressbookShell, userId) {
      var userPrivileges;

      if (addressbookShell.isSubscription) {
        userPrivileges = _getAuthenticatedUserPrivileges(addressbookShell.source.acl);
      } else {
        userPrivileges = _getUserPrivileges(addressbookShell.acl, userId);
      }

      return userPrivileges.indexOf(AVAILABLE_PRIVILEGES.all) !== -1 ||
        userPrivileges.indexOf(AVAILABLE_PRIVILEGES.write) !== -1;
    }

    function _getUserPrivileges(acl, userId) {
      if (!acl) {
        return [];
      }

      userId = userId || session.user._id;

      return acl.map(function(ace) {
        if (contactAddressbookParser.getUserIdFromPrincipalPath(ace.principal) === userId) {
          return ace.privilege;
        }
      }).filter(Boolean);
    }

    function _getAuthenticatedUserPrivileges(acl) {
      if (!acl) {
        return [];
      }

      return acl.map(function(ace) {
        if (ace.principal === AUTHENTICATED_USERS_PRINCIPAL) {
          return ace.privilege;
        }
      }).filter(Boolean);
    }

    function _isDefaultAddressbook(addressbookShell) {
      if (addressbookShell.isSubscription) {
        return false;
      }

      return addressbookShell.bookName === DEFAULT_ADDRESSBOOK_NAME ||
        addressbookShell.bookName === CONTACT_COLLECTED_ADDRESSBOOK_NAME;
    }
  }
})(angular);
