(function(angular) {
  'use strict';

  angular.module('linagora.esn.account')
    .run(run);

  function run(
    _,
    accountMessageRegistry,
    accountService,
    dynamicDirectiveService,
    socialHelper,
    FAB_ANCHOR_POINT,
    SUPPORTED_ACCOUNT_TYPES
  ) {
    accountService.getAccountProviders()
      .then(function(providers) {
        var supportedProviders = _.intersection(providers.data, _.values(SUPPORTED_ACCOUNT_TYPES));

        supportedProviders.forEach(function(provider) {
          var options = {
            attributes: [{
              name: 'type',
              value: provider
            }]
          };

          var directive = new dynamicDirectiveService.DynamicDirective(
            function() {
              return true;
            }, 'account-menu-item', options);

          dynamicDirectiveService.addInjection(FAB_ANCHOR_POINT, directive);
          accountMessageRegistry.register(provider, socialHelper.getAccountMessages(provider));
        });
      });

    var accountControlCenterMenu = new dynamicDirectiveService.DynamicDirective(true, 'controlcenter-menu-account', {priority: -2});
    dynamicDirectiveService.addInjection('controlcenter-sidebar-menu', accountControlCenterMenu);
  }
})(angular);
