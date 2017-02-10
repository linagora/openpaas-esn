(function() {
  'use strict';

  angular.module('esn.calendar')
    .controller('calMailToAttendeesController', calMailToAttendeesController);

  function calMailToAttendeesController(session, _) {
    var self = this;

    self.getEmailAddressesFromUsers = getEmailAddressesFromUsers;

    ////////////

    function getEmailAddressesFromUsers(list) {
      return _.chain(list).map('email').uniq().reject(removeTheCurrentUser).join().value();
    }

    function removeTheCurrentUser(email) {
     return email === session.user.preferredEmail;
    }
  }
})();
