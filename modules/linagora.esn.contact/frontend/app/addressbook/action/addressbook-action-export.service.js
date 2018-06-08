(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('contactAddressbookActionExport', contactAddressbookActionExport);

  function contactAddressbookActionExport($modal) {
    var exportAction = {
      name: 'Export',
      icon: 'cloud-download',
      when: function(context) {
        return context.addressbook.shell.canExportContact;
      },
      execute: _exportAddressbook
    };

    return exportAction;

    function _exportAddressbook(addressbook) {
      $modal({
        templateUrl: '/contact/app/addressbook/export/contact-addressbook-export.html',
        backdrop: 'static',
        placement: 'center',
        controller: 'ContactAddressbookExportController',
        controllerAs: '$ctrl',
        locals: {
          addressbook: addressbook
        }
      });
    }
  }
})(angular);
