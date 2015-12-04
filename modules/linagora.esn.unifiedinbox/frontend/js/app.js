'use strict';

angular.module('linagora.esn.unifiedinbox', [
  'ui.router',
  'esn.jmap-client-wrapper',
  'angularMoment',
  'esn.notification',
  'esn.iframe-resizer-wrapper',
  'esn.file',
  'esn.box-overlay',
  'esn.profile',
  'esn.summernote-wrapper',
  'esn.attendee',
  'esn.fullscreen-edit-form',
  'esn.scroll',
  'op.dynamicDirective',
  'esn.header',
  'esn.offline-wrapper',
  'matchMedia'
  ])
  .config(function($stateProvider, dynamicDirectiveServiceProvider) {
    $stateProvider.state('/unifiedinbox', {
      url: '/unifiedinbox',
      templateUrl: '/unifiedinbox/views/unifiedinbox'
    })
    .state('/unifiedinbox/compose', {
      url: '/unifiedinbox/compose',
      template: '<composer/>'
    })
    .state('/unifiedinbox/compose/:emailId', {
      url: '/unifiedinbox/compose/:emailId',
      template: '<composer/>'
    })
    .state('/unifiedinbox/:mailbox', {
      url: '/unifiedinbox/:mailbox',
      templateUrl: '/unifiedinbox/views/listEmails',
      controller: 'listEmailsController'
    })
    .state('/unifiedinbox/:mailbox/:emailId', {
      url: '/unifiedinbox/:mailbox/:emailId',
      templateUrl: '/unifiedinbox/views/viewEmail',
      controller: 'viewEmailController'
    });

    var sidebarDirective = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'inbox-menu', {priority: -150});
    dynamicDirectiveServiceProvider.addInjection('esn-sidebar-app-menu', sidebarDirective);
  });
