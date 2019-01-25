(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('ContactLiveUpdateInitializer', ContactLiveUpdateInitializer);

  function ContactLiveUpdateInitializer($rootScope, ContactLiveUpdate, session) {
    return {
      start: start
    };

    function start() {
      $rootScope.$on('$stateChangeSuccess', function(evt, current) {
        if (current && current.name &&
          (current.name.substring(0, 8) === 'contact.' || current.name.substring(0, 9) === '/contact/')) {
          var bookId = session.user._id;
          var domain_id = session.user.domains[0].domain_id;

          ContactLiveUpdate.startListen(bookId);
          ContactLiveUpdate.startListenDomain(domain_id);
        } else {
          ContactLiveUpdate.stopListen();
        }
      });
    }
  }
})(angular);
