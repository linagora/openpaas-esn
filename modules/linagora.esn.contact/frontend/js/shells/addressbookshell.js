'use strict';

angular.module('linagora.esn.contact')
  .factory('AddressBookShell', function() {
    function AddressBookShell(json) {

      this.name = json['dav:name'];
      this.description = json['carddav:description'];

      var davAcl = json['dav:acl'];
      this.readable = davAcl.indexOf('dav:read') > -1;
      this.editable = davAcl.indexOf('dav:write') > -1;

      this.href = json._links.self.href;
      this.id = this.href.split('/').pop().split('.').shift();
    }

    return AddressBookShell;
  });
