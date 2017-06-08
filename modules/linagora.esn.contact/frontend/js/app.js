'use strict';

angular.module('linagora.esn.contact', [
  'esn.router',
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
  'esn.cache',
  'esn.highlight',
  'esn.provider',
  'esn.module-registry',
  'esn.datetime',
  'esn.i18n'
])
  .config(function($stateProvider, routeResolver) {
    $stateProvider.state('contact', {
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
    .state('/contact/new/:bookId/:bookName', {
      url: '/contact/new/:bookId/:bookName',
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

  .run(function(attendeeService, ContactAttendeeProvider, searchContactProviderService, searchProviders, esnModuleRegistry, CONTACT_MODULE_METADATA) {
    attendeeService.addProvider(ContactAttendeeProvider);
    searchProviders.add(searchContactProviderService);
    esnModuleRegistry.add(CONTACT_MODULE_METADATA);
  });
