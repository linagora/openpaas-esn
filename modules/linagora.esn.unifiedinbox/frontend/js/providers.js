'use strict';

angular.module('linagora.esn.unifiedinbox')

  .factory('inboxProviders', function($injector, $q) {
    var providers = [];

    return {
      add: function(provider) { providers.push(provider); },
      getAll: function() {
        return $q.all(providers.map(function(provider) {
          if (provider.defaultContainer) {
            return $q.when(provider);
          }

          return $injector.invoke(provider.getDefaultContainer).then(function(container) {
            provider.defaultContainer = container;

            return provider;
          });
        }));
      }
    };
  })

  .factory('twitterProvider', function($q, inboxRestangular) {
    return function(username) {
      return {
        fetch: function(container) {
          return function(position, limit) {
            /*var params = angular.extend({ account_id: container }, { count: limit });

            return inboxRestangular.one('inbox').customGETLIST('tweets', params);*/
            return $q.when([{
              text: 'Tweet 1',
              date: Date.now()
            }, {
              text: 'Tweet 2',
              date: Date.now() - 50000
            }]);
          };
        },
        getDefaultContainer: function() { return $q.when(username); },
        templateUrl: '/unifiedinbox/views/unified-inbox/elements/tweet'
      };
    };
  })

  .factory('inboxHostedMailMessagesProvider', function(withJmapClient, Email, JMAP_GET_MESSAGES_LIST) {
    return {
      fetch: function(container) {
        return function(position, limit) {
          return withJmapClient(function(client) {
            return client
              .getMessageList({
                filter: {
                  inMailboxes: [container]
                },
                sort: ['date desc'],
                collapseThreads: false,
                fetchMessages: false,
                position: position,
                limit: limit
              })
              .then(function(messageList) {
                return messageList.getMessages({ properties: JMAP_GET_MESSAGES_LIST });
              })
              .then(function(messages) { return messages.map(Email); });
          });
        };
      },
      getDefaultContainer: function(jmap, _) {
        return withJmapClient(function(client) {
          return client.getMailboxWithRole(jmap.MailboxRole.INBOX).then(_.property('id'));
        });
      },
      templateUrl: '/unifiedinbox/views/unified-inbox/elements/message'
    };
  });
