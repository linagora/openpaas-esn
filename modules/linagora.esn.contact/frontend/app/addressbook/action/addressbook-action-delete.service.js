(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('contactAddressbookActionDelete', contactAddressbookActionDelete);

  function contactAddressbookActionDelete($modal) {
    var deleteAction = {
      name: 'Delete',
      icon: 'delete',
      when: function(context) {
        return context.addressbook.isWritable();
      },
      execute: _openDeleteModal
    };

    return deleteAction;

    function _openDeleteModal(addressbook) {
      $modal({
        templateUrl: '/contact/app/addressbook/delete/addressbook-delete.html',
        backdrop: 'static',
        placement: 'center',
        controller: 'ContactAddressbookDeleteController',
        controllerAs: '$ctrl',
        locals: {
          addressbook: addressbook
        }
      });
    }
  }
})(angular);
