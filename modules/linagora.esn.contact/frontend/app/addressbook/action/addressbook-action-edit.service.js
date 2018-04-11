(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('contactAddressbookActionEdit', contactAddressbookActionEdit);

  function contactAddressbookActionEdit($modal) {
    var editAction = {
      name: 'Edit',
      icon: 'pencil',
      when: function(context) {
        return context.addressbook.shell.canEditAddressbook;
      },
      execute: _openEditModal
    };

    return editAction;

    function _openEditModal(addressbook) {
      $modal({
        templateUrl: '/contact/app/addressbook/edit/addressbook-edit.html',
        backdrop: 'static',
        placement: 'center',
        controller: 'ContactAddressbookEditController',
        controllerAs: '$ctrl',
        locals: {
          addressbook: addressbook
        }
      });
    }
  }
})(angular);
