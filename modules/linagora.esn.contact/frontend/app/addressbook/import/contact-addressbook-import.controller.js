(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .controller('ContactAddressbookImportController', ContactAddressbookImportController);

  function ContactAddressbookImportController(
    asyncAction,
    contentTypeService,
    contactAddressbookService,
    contactAddressbookDisplayService,
    contactService
  ) {
    var self = this;
    var VCARD_FILE_TYPES = ['text/vcard', 'text/x-vcard'];
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

          return contactAddressbookDisplayService.convertShellsToDisplayShells(addressbooks, { includePriority: true });
        })
        .then(function(addressbookDisplayShells) {
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

      self.isValid = VCARD_FILE_TYPES.indexOf(file[0].type) !== -1;

      if (self.isValid) {
        self.file = file[0];
      }
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
