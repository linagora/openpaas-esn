'use strict';

angular.module('linagora.esn.mute', [
  'esn.router',
  'op.dynamicDirective'
  ])
  .config(function($stateProvider, dynamicDirectiveServiceProvider) {
    $stateProvider
      .state('mute', {
        url: '/mute',
        templateUrl: '/mute/views/unifiedinbox',
        controller: 'rootController as ctrl',
        deepStateRedirect: {
          default: 'unifiedinbox.inbox',
          fn: function() {
            return { state: 'unifiedinbox.inbox' };
          }
        }
      });

    // var inbox = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'application-menu-inbox', {priority: 45});
    // dynamicDirectiveServiceProvider.addInjection('esn-application-menu', inbox);

    // var attachmentDownloadAction = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'attachment-download-action');
    // dynamicDirectiveServiceProvider.addInjection('attachments-action-list', attachmentDownloadAction);
  });
