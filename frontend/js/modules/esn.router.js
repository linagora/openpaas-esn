'use strict';

angular.module('esn.router', [
  'esn.session',
  'esn.configuration',
  'esn.constants',
  'ui.router'
])

  .config(function($urlMatcherFactoryProvider) {
    // This option allows to have trailing slash at the end of the browser url.
    // It must be set before any configuration on $stateProvider or $urlRouterProvider.
    $urlMatcherFactoryProvider.strictMode(false);
  })

  .factory('esnRouterHelper', function($state, esnConfig, session, ESN_ROUTER_DEFAULT_HOME_PAGE) {
    function goToHomePage() {
      return session.ready.then(function() {
        return esnConfig('core.homePage').then(function(homePage) {
          var isValidState = $state.href(String(homePage));

          if (isValidState) {
            return $state.go(homePage);
          }

          return $state.go(ESN_ROUTER_DEFAULT_HOME_PAGE);
        });
      });
    }

    return {
      goToHomePage: goToHomePage
    };
  });
