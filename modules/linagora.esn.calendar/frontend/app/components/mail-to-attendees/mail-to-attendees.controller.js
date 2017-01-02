(function() {
  'use strict';

  angular.module('esn.calendar')
    .controller('mailToAttendeesController', mailToAttendeesController);

  function mailToAttendeesController(_) {
    var self = this;

    self.getEmailAddressesFromUsers = getEmailAddressesFromUsers;

    ////////////

    function getEmailAddressesFromUsers(list) {
      return _.chain(list).map('email').uniq().join().value();
    }
  }
})();
