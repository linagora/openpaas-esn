'use strict';

angular.module('linagora.esn.account')

  .factory('AccountRestangular', function(Restangular) {
    return Restangular.withConfig(function(RestangularConfigurer) {
      RestangularConfigurer.setBaseUrl('/account/api');
      RestangularConfigurer.setFullResponse(true);
    });
  })

  .factory('accountService', function(AccountRestangular) {

    function getAccounts(options) {
      return AccountRestangular.all('accounts').getList(options);
    }

    return {
      getAccounts: getAccounts
    };

  })

  .factory('accountMessageRegistry', function(OAUTH_DEFAULT_MESSAGES, OAUTH_UNKNOWN_MESSAGE) {

    var cache = {};

    function register(provider, messages) {
      cache[provider] = messages;
    }

    function get(provider, type) {
      if (cache[provider]) {
        var messages = cache[provider];
        return messages[type] ? messages[type] : OAUTH_DEFAULT_MESSAGES[type] || OAUTH_UNKNOWN_MESSAGE;
      }

      return OAUTH_DEFAULT_MESSAGES[type] || OAUTH_UNKNOWN_MESSAGE;
    }

    return {
      register: register,
      get: get
    };
  })

  .factory('displayAccountMessageLevel', function(OAUTH_MESSAGE_LEVELS) {
    return function(status) {
      return OAUTH_MESSAGE_LEVELS[status] || OAUTH_MESSAGE_LEVELS.default;
    };
  })

  .factory('displayAccountMessage', function($alert, accountMessageRegistry, displayAccountMessageLevel) {
    return function(provider, status) {
      $alert({
        content: accountMessageRegistry.get(provider, status),
        type: displayAccountMessageLevel(status),
        show: true,
        position: 'bottom',
        container: '.account-error-container',
        duration: '3',
        animation: 'am-flip-x'
      });
    };
  });
