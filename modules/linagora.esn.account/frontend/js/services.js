'use strict';

angular.module('linagora.esn.account')

  .factory('AccountRestangular', function(Restangular, httpConfigurer) {
    var restangularInstance = Restangular.withConfig(function(RestangularConfigurer) {
      RestangularConfigurer.setFullResponse(true);
    });

    httpConfigurer.manageRestangular(restangularInstance, '/account/api');

    return restangularInstance;
  })

  .factory('accountService', function(AccountRestangular) {

    function getAccounts(options) {
      return AccountRestangular.all('accounts').getList(options);
    }

    function getAccountProviders() {
      return AccountRestangular.all('accounts').all('providers').getList();
    }

    return {
      getAccounts: getAccounts,
      getAccountProviders: getAccountProviders
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

  .factory('displayAccountMessage', function(accountMessageRegistry, notificationFactory) {
    return function(provider, status) {
      notificationFactory.weakInfo('', accountMessageRegistry.get(provider, status));
    };
  })

  .factory('socialHelper', function(OAUTH_SOCIAL_MESSAGES, _) {
    function getAccountMessages(type) {
      var message = {};

      _.forIn(OAUTH_SOCIAL_MESSAGES, function(value, key) {
        message[key] = value.replace('social', type);
      });

      return message;
    }

    return {
      getAccountMessages: getAccountMessages
    };
  });
