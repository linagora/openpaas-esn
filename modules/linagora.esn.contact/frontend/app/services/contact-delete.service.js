(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('deleteContact', deleteContact);

  function deleteContact(
    $rootScope,
    $q,
    contactService,
    gracePeriodService,
    notificationFactory,
    esnI18nService,
    GRACE_DELAY,
    CONTACT_EVENTS
  ) {
    return function(bookId, bookName, contact) {
      var options = { graceperiod: GRACE_DELAY };

      if (contact.etag) {
        options.etag = contact.etag;
      }

      return contactService.removeContact({ bookId: bookId, bookName: bookName }, contact, options)
        .then(function(taskId) {
          $rootScope.$broadcast(CONTACT_EVENTS.DELETED, contact);

          return gracePeriodService.grace({
            id: taskId,
            performedAction: esnI18nService.translate('You have just deleted a contact (%s)', contact.displayName),
            cancelFailed: 'Cannot cancel contact deletion, the contact might be deleted permanently',
            cancelTooLate: 'It is too late to cancel the contact deletion, the contact might be deleted permanently'
          }).catch(function() {
            $rootScope.$broadcast(CONTACT_EVENTS.CANCEL_DELETE, contact);
          });
        }, function(err) {
          notificationFactory.weakError('Contact Delete', 'The contact cannot be deleted, please retry later');

          return $q.reject(err);
        });
    };
  }
})(angular);
