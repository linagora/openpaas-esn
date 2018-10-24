(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('contactAddressbookACLHelper', contactAddressbookACLHelper);

  function contactAddressbookACLHelper(
    _,
    session,
    contactAddressbookParser,
    DEFAULT_ADDRESSBOOK_NAME,
    CONTACT_COLLECTED_ADDRESSBOOK_NAME,
    CONTACT_ADDRESSBOOK_AUTHENTICATED_PRINCIPAL
  ) {
    var AVAILABLE_PRIVILEGES = {
      all: '{DAV:}all',
      read: '{DAV:}read',
      write: '{DAV:}write',
      writeProperties: '{DAV:}write-properties',
      writeContent: '{DAV:}write-content',
      bind: '{DAV:}bind',
      unbind: '{DAV:}unbind',
      share: '{DAV:}share'
    };

    return {
      canEditAddressbook: canEditAddressbook,
      canDeleteAddressbook: canDeleteAddressbook,
      canShareAddressbook: canShareAddressbook,
      canCreateContact: canCreateContact,
      canEditContact: canEditContact,
      canCopyContact: canCopyContact,
      canMoveContact: canMoveContact,
      canDeleteContact: canDeleteContact,
      canExportContact: canExportContact
    };

    function canEditAddressbook(addressbookShell, userId) {
      if (_isDefaultAddressbook(addressbookShell)) {
        return false;
      }

      var userPrivileges = _getUserPrivileges(addressbookShell.acl, userId, addressbookShell.group && addressbookShell.group.id);

      return userPrivileges.indexOf(AVAILABLE_PRIVILEGES.all) > -1 ||
             userPrivileges.indexOf(AVAILABLE_PRIVILEGES.write) > -1 ||
             userPrivileges.indexOf(AVAILABLE_PRIVILEGES.writeProperties) > -1;
    }

    function canDeleteAddressbook(addressbookShell, userId) {
      // if you can edit AB, you can delete it too
      return canEditAddressbook(addressbookShell, userId);
    }

    function canShareAddressbook(addressbookShell, userId) {
      var userPrivileges = _getContactPrivileges(addressbookShell, userId);

      return userPrivileges.indexOf(AVAILABLE_PRIVILEGES.all) > -1 ||
             userPrivileges.indexOf(AVAILABLE_PRIVILEGES.share) > -1;
    }

    function canCreateContact(addressbookShell, userId) {
      var userPrivileges = _getContactPrivileges(addressbookShell, userId);

      return userPrivileges.indexOf(AVAILABLE_PRIVILEGES.all) > -1 ||
             userPrivileges.indexOf(AVAILABLE_PRIVILEGES.write) > -1 ||
             userPrivileges.indexOf(AVAILABLE_PRIVILEGES.bind) > -1;
    }

    function canEditContact(addressbookShell, userId) {
      var userPrivileges = _getContactPrivileges(addressbookShell, userId);

      return userPrivileges.indexOf(AVAILABLE_PRIVILEGES.all) > -1 ||
             userPrivileges.indexOf(AVAILABLE_PRIVILEGES.write) > -1 ||
             userPrivileges.indexOf(AVAILABLE_PRIVILEGES.writeContent) > -1;
    }

    function canCopyContact() {
      return true; // Now allows copy contact as default
    }

    function canMoveContact(addressbookShell, userId) {
      return canDeleteContact(addressbookShell, userId);
    }

    function canDeleteContact(addressbookShell, userId) {
      var userPrivileges = _getContactPrivileges(addressbookShell, userId);

      return userPrivileges.indexOf(AVAILABLE_PRIVILEGES.all) > -1 ||
             userPrivileges.indexOf(AVAILABLE_PRIVILEGES.write) > -1 ||
             userPrivileges.indexOf(AVAILABLE_PRIVILEGES.unbind) > -1;
    }

    function canExportContact() {
      return true; // Now allows export contact as default
    }

    function _getContactPrivileges(addressbookShell, userId) {
      var userPrivileges = [];

      if (addressbookShell.isSubscription) {
        userPrivileges = userPrivileges.concat(
          _getAuthenticatedUserPrivileges(addressbookShell.source.acl, userId),
          _getUserPrivileges(addressbookShell.source.acl, userId, addressbookShell.group && addressbookShell.group.id)
        );
      } else {
        userPrivileges = userPrivileges.concat(
          _getAuthenticatedUserPrivileges(addressbookShell.acl, userId),
          _getUserPrivileges(addressbookShell.acl, userId, addressbookShell.group && addressbookShell.group.id)
        );
      }

      return _.uniq(userPrivileges);
    }

    function _getUserPrivileges(acl, userId, groupId) {
      if (!acl) {
        return [];
      }

      userId = userId || session.user._id;

      return acl.map(function(ace) {
        if ([groupId, userId].indexOf(contactAddressbookParser.parsePrincipalPath(ace.principal).id) !== -1) {
          return ace.privilege;
        }
      }).filter(Boolean);
    }

    function _getAuthenticatedUserPrivileges(acl) {
      if (!acl) {
        return [];
      }

      return acl.map(function(ace) {
        if (ace.principal === CONTACT_ADDRESSBOOK_AUTHENTICATED_PRINCIPAL) {
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
