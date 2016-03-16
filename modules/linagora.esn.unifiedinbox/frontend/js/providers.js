'use strict';

angular.module('linagora.esn.unifiedinbox')

  .factory('inboxProviders', function($injector, $q) {
    var providers = [];

    return {
      add: function(provider) { providers.push(provider); },
      getAll: function() {
        return $q.all(providers.map(function(provider) {
          if (provider.fetcher) {
            return $q.when(provider);
          }

          return $injector.invoke(provider.getDefaultContainer).then(function(container) {
            provider.fetcher = provider.fetch(container);

            return provider;
          });
        }));
      }
    };
  })

  .factory('inboxTwitterProvider', function($q, $http, inMemoryPaging, _) {
    return function(accountId) {
      return {
        fetch: function() {
          return inMemoryPaging(function(position, limit) {
            return $http
              .get('/unifiedinbox/api/inbox/tweets', { params: { account_id: accountId, count: limit }  })
              .then(_.property('data'));
          });
        },
        getDefaultContainer: function() { return $q.when(); },
        templateUrl: '/unifiedinbox/views/unified-inbox/elements/tweet'
      };
    };
  })

  .factory('inboxHostedMailMessagesProvider', function(withJmapClient, Email, inMemoryPaging, JMAP_GET_MESSAGES_LIST) {
    return {
      fetch: function(container) {
        return inMemoryPaging(function(position, limit) {
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
        });
      },
      getDefaultContainer: function(jmap, _) {
        return withJmapClient(function(client) {
          return client.getMailboxWithRole(jmap.MailboxRole.INBOX).then(_.property('id'));
        });
      },
      templateUrl: '/unifiedinbox/views/unified-inbox/elements/message'
    };
  })

  .factory('inMemoryPaging', function($q, ELEMENTS_PER_REQUEST) {
    return function(loadMoreElements) {
      var cache = [];

      return function(offset, limit) {
        function slice() {
          return cache.slice(offset, offset + limit);
        }

        if (cache.length > offset) {
          return $q.when(slice());
        }

        if (cache.length > 0 && cache.length < ELEMENTS_PER_REQUEST) {
          return $q.when([]);
        }

        return loadMoreElements(cache.length, ELEMENTS_PER_REQUEST)
          .then(function(results) { cache = cache.concat(results); })
          .then(slice);
      };
    };
  });
