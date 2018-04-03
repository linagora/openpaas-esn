(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('AddressbookShell', addressbookShellFactory);

  function addressbookShellFactory(contactAddressbookParser) {

    function AddressbookShell(json) {
      var davAcl = json['dav:acl'];
      var subscriptionSource = json['openpaas:source'];
      var metadata = contactAddressbookParser.parseAddressbookPath(json._links.self.href);

      this.name = json['dav:name'];
      this.description = json['carddav:description'];
      this.type = json.type;
      this.href = json._links.self.href;
      this.bookName = metadata.bookName;
      this.bookId = metadata.bookId;

      if (davAcl && davAcl.length) {
        this.readable = davAcl.indexOf('dav:read') > -1;
        this.editable = davAcl.indexOf('dav:write') > -1;
      }

      if (subscriptionSource) {
        this.source = new AddressbookShell(subscriptionSource);
      }
    }

    AddressbookShell.prototype.isSubscription = isSubscription;

    function isSubscription() {
      return !!this.source;
    }

    return AddressbookShell;
  }
})(angular);
