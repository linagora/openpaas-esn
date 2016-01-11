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
  'matchMedia',
  'esn.lodash-wrapper'
  ])
  .config(function($stateProvider, dynamicDirectiveServiceProvider) {
    $stateProvider.state('/unifiedinbox', {
      url: '/unifiedinbox',
      templateUrl: '/unifiedinbox/views/unifiedinbox'
    })
    .state('/unifiedinbox/compose', {
      url: '/unifiedinbox/compose',
      template: '<composer/>',
      params: {email: {}}
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

    var inbox = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'application-menu-inbox', {priority: 45});
    dynamicDirectiveServiceProvider.addInjection('esn-application-menu', inbox);
  });
