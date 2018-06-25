(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .controller('ContactAddressbookImportController', ContactAddressbookImportController);

  function ContactAddressbookImportController(
    asyncAction,
    contactAddressbookService,
    contactAddressbookDisplayService,
    contactService
  ) {
    var self = this;
    var VCARD_FILE_TYPE = 'text/vcard';
    var LOADING_STATUS = {
      loading: 'loading',
      loaded: 'loaded',
      error: 'error'
    };

    self.file = null;
    self.isValid = false;

    self.$onInit = $onInit;
    self.onFileSelect = onFileSelect;
    self.doImport = doImport;

    function $onInit() {
      self.status = LOADING_STATUS.loading;
      contactAddressbookService.listAddressbooksUserCanCreateContact()
        .then(function(addressbooks) {
          self.status = LOADING_STATUS.loaded;
          var addressbookDisplayShells = contactAddressbookDisplayService.convertShellsToDisplayShells(addressbooks, { includePriority: true });

          self.addressbookDisplayShells = contactAddressbookDisplayService.sortAddressbookDisplayShells(addressbookDisplayShells);
          self.selectedAddressbookShell = self.addressbookDisplayShells[0].shell;
        })
        .catch(function() {
          self.status = LOADING_STATUS.error;
        });
    }

    function onFileSelect(file) {
      if (!file || !(file.length > 0)) {
        return;
      }

      self.file = file[0];
      self.isValid = self.file.type === VCARD_FILE_TYPE;
    }

    function doImport() {
      var notificationMessages = {
        progressing: 'Submitting importing contacts request...',
        success: 'Request submitted',
        failure: 'Failed to submit request'
      };

      asyncAction(notificationMessages, function() {
        return contactService.importContactsFromFile(self.selectedAddressbookShell, self.file);
      });
    }
  }
})(angular);
