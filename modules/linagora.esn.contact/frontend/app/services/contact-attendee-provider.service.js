(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('ContactAttendeeProvider', ContactAttendeeProvider);

  function ContactAttendeeProvider(
    $q,
    $log,
    session,
    ContactAPIClient,
    ContactsHelper
  ) {
    return {
      objectType: 'contact',
      searchAttendee: function(query) {
        var searchOptions = {
          data: query,
          userId: session.user._id
        };

        return ContactAPIClient
          .addressbookHome(session.user._id)
          .search(searchOptions)
          .then(function(response) {
            response.data.forEach(function(contact) {
              ContactsHelper.orderData(contact);
              if (contact.emails && contact.emails.length !== 0) {
                contact.email = contact.emails[0].value;
              }
            });

            return response.data;
          }, function(error) {
            $log.error('Error while searching contacts: ' + error);

            return $q.when([]);
          });
      },
      templateUrl: '/contact/app/contact/auto-complete/contact-auto-complete.html'
    };
  }

})(angular);
