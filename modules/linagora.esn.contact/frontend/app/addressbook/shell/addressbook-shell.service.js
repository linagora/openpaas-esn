(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('AddressbookShell', addressbookShellFactory);

  function addressbookShellFactory(
    contactAddressbookParser,
    contactAddressbookACLHelper
  ) {

    function AddressbookShell(json) {
      var metadata = contactAddressbookParser.parseAddressbookPath(json._links.self.href);

      this.name = json['dav:name'];
      this.description = json['carddav:description'];
      this.type = json.type;
      this.href = json._links.self.href;
      this.bookName = metadata.bookName;
      this.bookId = metadata.bookId;
      this.acl = json.acl;

      if (json['openpaas:source']) {
        this.source = new AddressbookShell(json['openpaas:source']);
        this.isSubscription = true;
      }

      this.canEditAddressbook = contactAddressbookACLHelper.canEditAddressbook(this);
      this.canDeleteAddressbook = contactAddressbookACLHelper.canDeleteAddressbook(this);
      this.canCreateContact = contactAddressbookACLHelper.canCreateContact(this);
      this.canEditContact = contactAddressbookACLHelper.canEditContact(this);
      this.canCopyContact = contactAddressbookACLHelper.canCopyContact(this);
      this.canMoveContact = contactAddressbookACLHelper.canMoveContact(this);
      this.canDeleteContact = contactAddressbookACLHelper.canDeleteContact(this);
    }

    return AddressbookShell;
  }
})(angular);
