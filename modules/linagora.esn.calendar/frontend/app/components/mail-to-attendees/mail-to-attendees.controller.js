(function() {
  'use strict';

  angular.module('esn.calendar')
    .controller('calMailToAttendeesController', calMailToAttendeesController);

  function calMailToAttendeesController(_) {
    var self = this;

    self.getEmailAddressesFromUsers = getEmailAddressesFromUsers;

    ////////////

    function getEmailAddressesFromUsers(list) {
      return _.chain(list).map('email').uniq().join().value();
    }
  }
})();
