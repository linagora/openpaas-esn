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
  'esn.search',
  'esn.scroll',
  'esn.multi-input',
  'esn.attendee',
  'esn.header',
  'esn.form.helper',
  'esn.sidebar',
  'op.dynamicDirective',
  'esn.url'
])
  .config(function($stateProvider, routeResolver) {
    $stateProvider.state('/contact', {
      url: '/contact',
      templateUrl: '/contact/views/contacts',
      controller: 'contactsListController',
      resolve: {
        domain: routeResolver.session('domain'),
        user: routeResolver.session('user')
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
    .state('/contact/show/:bookId/:cardId', {
      url: '/contact/show/:bookId/:cardId',
      templateUrl: '/contact/views/contact-show',
      controller: 'showContactController',
      resolve: {
        domain: routeResolver.session('domain'),
        user: routeResolver.session('user')
      }
    })
    .state('/contact/edit/:bookId/:cardId', {
      url: '/contact/edit/:bookId/:cardId',
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
