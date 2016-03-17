'use strict';

angular.module('linagora.esn.mute', [
  'esn.router',
  'op.dynamicDirective'
  ])
  .config(function($stateProvider, dynamicDirectiveServiceProvider) {
    $stateProvider
      .state('mute', {
        url: '/mute',
        templateUrl: '/mute/views/mute',
        controller: 'muteController'
      })
      
      .state('mutedocument', {
        url: '/mute/:id',
        templateUrl: '/mute/views/partials/mute-iframe',
        controller: 'muteIframeController'
      });

    var mute = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'application-menu-mute', {priority: 45});
    dynamicDirectiveServiceProvider.addInjection('esn-application-menu', mute);

    // var attachmentDownloadAction = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'attachment-download-action');
    // dynamicDirectiveServiceProvider.addInjection('attachments-action-list', attachmentDownloadAction);
  });
