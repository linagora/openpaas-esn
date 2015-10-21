'use strict';

angular.module('linagora.esn.contact', [
  'restangular', 'esn.alphalist', 'mgcrea.ngStrap.datepicker', 'mgcrea.ngStrap.alert', 'uuid4',
  'mgcrea.ngStrap.helpers.dateParser', 'mgcrea.ngStrap.helpers.dateFormatter', 'linagora.esn.graceperiod',
  'esn.search', 'esn.scroll', 'esn.multi-input', 'esn.attendee'
])
  .config(function($routeProvider, routeResolver) {
  $routeProvider.when('/contact', {
    templateUrl: '/contact/views/contacts',
    controller: 'contactsListController',
    resolve: {
      domain: routeResolver.session('domain'),
      user: routeResolver.session('user')
    },
    reloadOnSearch: false
  });
  $routeProvider.when('/contact/new/:bookId', {
    templateUrl: '/contact/views/contact-new',
    controller: 'newContactController',
    resolve: {
      domain: routeResolver.session('domain'),
      user: routeResolver.session('user')
    }
  });
  $routeProvider.when('/contact/show/:bookId/:cardId', {
    templateUrl: '/contact/views/contact-show',
    controller: 'showContactController',
    resolve: {
      domain: routeResolver.session('domain'),
      user: routeResolver.session('user')
    }
  });
  $routeProvider.when('/contact/edit/:bookId/:cardId', {
    templateUrl: '/contact/views/contact-edit',
    controller: 'editContactController',
    resolve: {
      domain: routeResolver.session('domain'),
      user: routeResolver.session('user')
    }
  });
})
  .run(function($q, $log, attendeeService, contactsService, session) {
    var contactProvider = {
      searchAttendee: function(query) {
        return contactsService.searchAllAddressBooks(session.user._id, query).then(function(response) {
          response.hits_list.forEach(function(contact) {
            if (contact.emails && contact.emails.length !== 0) {
              contact.email = contact.emails[0].value;
            }
          });
          return response.hits_list;
        }, function(error) {
          $log('Error while searching contacts: ' + error);
          return $q.when([]);
        });
      },
      templateUrl: '/contact/views/partials/contact-auto-complete.html'
    };
    attendeeService.addProvider(contactProvider);
  });
