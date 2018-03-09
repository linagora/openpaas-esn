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
  .config(function($stateProvider, $urlRouterProvider, routeResolver) {
    $urlRouterProvider.when('/contact', '/contact/addressbooks/');

    $stateProvider
      .state('contact', {
        url: '/contact',
        templateUrl: '/contact/app/app.html'
      })
      .state('contact.addressbooks', {
        url: '/addressbooks/:bookName',
        views: {
          'main@contact': {
            templateUrl: '/contact/views/contacts',
            controller: 'contactsListController',
            resolve: {
              domain: routeResolver.session('domain'),
              user: routeResolver.session('user'),
              addressbooks: function($stateParams, session, contactAddressbookService) {
                return session.ready.then(function() {
                  if ($stateParams.bookName) {
                    return contactAddressbookService.getAddressbookByBookName($stateParams.bookName)
                      .then(function(addressbook) {
                        return [addressbook];
                      });
                  }

                  return contactAddressbookService.listAddressbooks();
                });
              }
            }
          }
        }
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

  .run(function(
    attendeeService,
    ContactAttendeeProvider,
    esnModuleRegistry,
    searchContactProviderService,
    searchProviders,
    CONTACT_MODULE_METADATA
  ) {
    attendeeService.addProvider(ContactAttendeeProvider);
    searchProviders.add(searchContactProviderService);
    esnModuleRegistry.add(CONTACT_MODULE_METADATA);
  });
