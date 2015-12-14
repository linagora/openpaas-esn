'use strict';

angular.module('linagora.esn.contact.import', [
  'restangular',
  'esn.session',
  'esn.notification',
  'esn.websocket'
])
.run(function(ContactImportNotificationService, session) {
  session.ready.then(function(session) {
    ContactImportNotificationService.startListen(session.user._id);
  });
});
