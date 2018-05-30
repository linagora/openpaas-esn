(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .run(initializeContactLiveUpdate);

  function initializeContactLiveUpdate(ContactLiveUpdateInitializer) {
    ContactLiveUpdateInitializer.start();
  }
})(angular);
