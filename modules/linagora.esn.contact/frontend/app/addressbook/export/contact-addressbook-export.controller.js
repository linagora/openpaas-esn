(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .controller('ContactAddressbookExportController', ContactAddressbookExportController);

  function ContactAddressbookExportController(
    addressbook,
    contactAddressbookDisplayService
  ) {
    var self = this;

    self.$onInit = $onInit;

    function $onInit() {
      self.addressbookDisplayShell = contactAddressbookDisplayService.convertShellToDisplayShell(addressbook);
      self.exportUrl = _buildExportUrl(addressbook);
    }

    function _buildExportUrl(addressbook) {
      var bookId = addressbook.isSubscription ? addressbook.source.bookId : addressbook.bookId;
      var bookName = addressbook.isSubscription ? addressbook.source.bookName : addressbook.bookName;

      return '/dav/api/addressbooks/' + bookId + '/' + bookName + '?export';
    }
  }
})(angular);
