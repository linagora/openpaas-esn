'use strict';

angular.module('linagora.esn.contact')
  .factory('AddressBookShell', function() {
    function AddressBookShell(json) {

      this.name = json['dav:name'];
      this.description = json['carddav:description'];

      var davAcl = json['dav:acl'];
      if (davAcl && davAcl.length) {
        this.readable = davAcl.indexOf('dav:read') > -1;
        this.editable = davAcl.indexOf('dav:write') > -1;
      }

      this.href = json._links.self.href;
      var split = this.href.split('/');
      this.bookName = split.pop().split('.').shift();
      this.bookId = split.pop();
      this.id = this.bookName;
    }

    return AddressBookShell;
  });
