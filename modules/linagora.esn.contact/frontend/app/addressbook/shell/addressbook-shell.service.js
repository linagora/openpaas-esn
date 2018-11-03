(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('AddressbookShell', addressbookShellFactory);

  function addressbookShellFactory(
    contactAddressbookParser,
    contactAddressbookACLHelper,
    ContactSharee,
    CONTACT_ADDRESSBOOK_PUBLIC_RIGHT,
    CONTACT_ADDRESSBOOK_AUTHENTICATED_PRINCIPAL
  ) {

    function AddressbookShell(json) {
      var metadata = contactAddressbookParser.parseAddressbookPath(json._links.self.href);

      this.name = json['dav:name'];
      this.description = json['carddav:description'];
      this.type = json.type;
      this.state = json.state;
      this.href = json._links.self.href;
      this.bookName = metadata.bookName;
      this.bookId = metadata.bookId;
      this.acl = json.acl;

      this.rights = {
        public: CONTACT_ADDRESSBOOK_PUBLIC_RIGHT.PRIVATE.value,
        members: []
      };

      if (json['openpaas:source']) {
        this.source = new AddressbookShell(json['openpaas:source']);
        this.isSubscription = true;
        this.subscriptionType = json['openpaas:subscription-type'];
        this.shareAccess = json['dav:share-access'];
      }

      if (json['dav:invite']) {
        this.sharees = json['dav:invite'].map(function(shareeInfo) {
          return ContactSharee.fromSharee(shareeInfo);
        });
      }

      if (json['dav:group']) {
        this.group = contactAddressbookParser.parsePrincipalPath(json['dav:group']);

        this.acl && this.acl.forEach(function(aclItem) {
          if (aclItem.principal === json['dav:group']) {
            this.rights.members.push(aclItem.privilege);
          }
        }, this);
      }

      this.group = this.group || (this.source && this.source.group);

      this.canEditAddressbook = contactAddressbookACLHelper.canEditAddressbook(this);
      this.canDeleteAddressbook = contactAddressbookACLHelper.canDeleteAddressbook(this);
      this.canShareAddressbook = contactAddressbookACLHelper.canShareAddressbook(this);
      this.canCreateContact = contactAddressbookACLHelper.canCreateContact(this);
      this.canEditContact = contactAddressbookACLHelper.canEditContact(this);
      this.canCopyContact = contactAddressbookACLHelper.canCopyContact(this);
      this.canMoveContact = contactAddressbookACLHelper.canMoveContact(this);
      this.canDeleteContact = contactAddressbookACLHelper.canDeleteContact(this);
      this.canExportContact = contactAddressbookACLHelper.canExportContact(this);

      this.acl && this.acl.forEach(function(aclItem) {
        if (aclItem.principal === CONTACT_ADDRESSBOOK_AUTHENTICATED_PRINCIPAL) {
          if (aclItem.privilege === CONTACT_ADDRESSBOOK_PUBLIC_RIGHT.READ.value || aclItem.privilege === CONTACT_ADDRESSBOOK_PUBLIC_RIGHT.WRITE.value) {
            this.rights.public = pickHighestPriorityRight(this.rights.public, aclItem.privilege);
          }
        }
      }, this);

      function pickHighestPriorityRight(oldPublicRight, newPublicRight) {
        var addressbookRightValues = [
          CONTACT_ADDRESSBOOK_PUBLIC_RIGHT.PRIVATE.value,
          CONTACT_ADDRESSBOOK_PUBLIC_RIGHT.READ.value,
          CONTACT_ADDRESSBOOK_PUBLIC_RIGHT.WRITE.value
        ];

        if (oldPublicRight && addressbookRightValues.indexOf(oldPublicRight) > addressbookRightValues.indexOf(newPublicRight)) {
          return oldPublicRight;
        }

        return newPublicRight;
      }
    }

    return AddressbookShell;
  }
})(angular);
