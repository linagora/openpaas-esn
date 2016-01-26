'use strict';

angular.module('linagora.esn.contact', [
  'ui.router',
  'restangular',
  'esn.alphalist',
  'mgcrea.ngStrap.datepicker',
  'mgcrea.ngStrap.alert',
  'uuid4',
  'mgcrea.ngStrap.helpers.dateParser',
  'mgcrea.ngStrap.helpers.dateFormatter',
  'linagora.esn.graceperiod',
  'linagora.esn.davproxy',
  'esn.search',
  'esn.scroll',
  'esn.multi-input',
  'esn.attendee',
  'esn.header',
  'esn.form.helper',
  'esn.sidebar',
  'op.dynamicDirective',
  'esn.url',
  'esn.aggregator',
  'esn.cache'
])
  .config(function($stateProvider, routeResolver) {
    $stateProvider.state('/contact', {
      url: '/contact',
      templateUrl: '/contact/views/contacts',
      controller: 'contactsListController',
      resolve: {
        domain: routeResolver.session('domain'),
        user: routeResolver.session('user'),
        addressbooks: function(ContactAPIClient, session) {
          return session.ready.then(function() {
            return ContactAPIClient.addressbookHome(session.user._id).addressbook().list();
          });
        }
      },
      reloadOnSearch: false
    })
    .state('/contact/new/:bookId', {
      url: '/contact/new/:bookId',
      templateUrl: '/contact/views/contact-new',
      controller: 'newContactController',
      resolve: {
        domain: routeResolver.session('domain'),
        user: routeResolver.session('user')
      }
    })
    .state('/contact/show/:bookId/:bookName/:cardId', {
      url: '/contact/show/:bookId/:bookName/:cardId',
      templateUrl: '/contact/views/contact-show',
      controller: 'showContactController',
      resolve: {
        domain: routeResolver.session('domain'),
        user: routeResolver.session('user')
      }
    })
    .state('/contact/edit/:bookId/:bookName/:cardId', {
      url: '/contact/edit/:bookId/:bookName/:cardId',
      templateUrl: '/contact/views/contact-edit',
      controller: 'editContactController',
      resolve: {
        domain: routeResolver.session('domain'),
        user: routeResolver.session('user')
      }
    });
  })

  .config(function(dynamicDirectiveServiceProvider) {

    function isContactWritable(scope) {
      return scope.displayShell.isWritable();
    }

    function injectDynamicDirective(condition, directive, destination) {
      var dynamicDirective = new dynamicDirectiveServiceProvider.DynamicDirective(condition, directive);
      dynamicDirectiveServiceProvider.addInjection(destination, dynamicDirective);
    }

    injectDynamicDirective(isContactWritable, 'contact-edit-action-item', 'contact-list-menu-items');
    injectDynamicDirective(isContactWritable, 'contact-delete-action-item', 'contact-list-menu-items');
    var contact = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'application-menu-contact', {priority: 35});
    dynamicDirectiveServiceProvider.addInjection('esn-application-menu', contact);
  })

  .run(function($q, $log, attendeeService, ContactAPIClient, session) {
    var contactProvider = {
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
              if (contact.emails && contact.emails.length !== 0) {
                contact.email = contact.emails[0].value;
              }
            });
            return response.data;
          }, function(error) {
            $log('Error while searching contacts: ' + error);
            return $q.when([]);
          });
      },
      templateUrl: '/contact/views/partials/contact-auto-complete.html'
    };
    attendeeService.addProvider(contactProvider);
  });
