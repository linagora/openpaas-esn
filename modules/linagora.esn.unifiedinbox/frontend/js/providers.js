'use strict';

angular.module('linagora.esn.unifiedinbox')

  .factory('findInboxMailboxId', function(withJmapClient, jmap, _) {
    return function() {
      return withJmapClient(function(client) {
        return client.getMailboxWithRole(jmap.MailboxRole.INBOX).then(_.property('id'));
      });
    };
  })

  .factory('inboxProviders', function($q, toAggregatorSource, ELEMENTS_PER_PAGE) {
    var providers = [];

    return {
      add: function(provider) { providers.push(provider); },
      getAll: function() {
        return $q.all(providers.map(function(provider) {
          return provider.getDefaultContainer().then(function(container) {
            provider.loadNextItems = toAggregatorSource(provider.fetch(container), ELEMENTS_PER_PAGE);

            return provider;
          });
        }));
      }
    };
  })

  .factory('toAggregatorSource', function() {
    return function(fetcher, length) {
      return function() {
        return fetcher().then(function(results) {
          return { data: results, lastPage: results.length < length };
        });
      };
    };
  })

  .factory('newInboxProvider', function(PageAggregatorService, toAggregatorSource, _, ELEMENTS_PER_REQUEST, ELEMENTS_PER_PAGE) {
    return function(provider) {
      return {
        name: provider.name,
        fetch: function(container) {
          var aggregator = new PageAggregatorService(provider.name, [{
            loadNextItems: toAggregatorSource(provider.fetch(container), ELEMENTS_PER_REQUEST)
          }], { results_per_page: ELEMENTS_PER_PAGE });

          return function() {
            return aggregator.loadNextItems()
              .then(_.property('data'))
              .then(function(results) {
                return results.map(function(result) {
                  if (!(result.date instanceof Date)) {
                    result.date = new Date(result.date);
                  }
                  result.templateUrl = provider.templateUrl;

                  return result;
                });
              });
          };
        },
        getDefaultContainer: provider.getDefaultContainer
      };
    };
  })

  .factory('inboxTwitterProvider', function($q, $http, newInboxProvider, _, ELEMENTS_PER_REQUEST) {
    return function(accountId) {
      return newInboxProvider({
        name: 'inboxTwitterProvider',
        fetch: function() {
          var oldestTweetId = null;

          return function() {
            return $http
              .get('/unifiedinbox/api/inbox/tweets', {
                params: {
                  account_id: accountId,
                  count: ELEMENTS_PER_REQUEST,
                  max_id: oldestTweetId
                }
              })
              .then(_.property('data'))
              .then(function(results) {
                if (results.length > 0) {
                  oldestTweetId = _.last(results).id;
                }

                return results;
              });
          };
        },
        getDefaultContainer: function() { return $q.when(); },
        templateUrl: '/unifiedinbox/views/unified-inbox/elements/tweet'
      });
    };
  })

  .factory('inboxHostedMailMessagesProvider', function(withJmapClient, Email, pagedJmapRequest, findInboxMailboxId,
                                                       newInboxProvider, JMAP_GET_MESSAGES_LIST, ELEMENTS_PER_REQUEST) {
    return newInboxProvider({
      name: 'inboxHostedMailMessagesProvider',
      fetch: function(container) {
        return pagedJmapRequest(function(position) {
          return withJmapClient(function(client) {
            return client.getMessageList({
              filter: {
                inMailboxes: [container]
              },
              sort: ['date desc'],
              collapseThreads: false,
              fetchMessages: false,
              position: position,
              limit: ELEMENTS_PER_REQUEST
            })
              .then(function(messageList) {
                return messageList.getMessages({ properties: JMAP_GET_MESSAGES_LIST });
              })
              .then(function(messages) { return messages.map(Email); });
          });
        });
      },
      getDefaultContainer: findInboxMailboxId,
      templateUrl: '/unifiedinbox/views/unified-inbox/elements/message'
    });
  })

  .factory('inboxHostedMailThreadsProvider', function($q, withJmapClient, pagedJmapRequest, Email, _, findInboxMailboxId,
                                                      newInboxProvider, JMAP_GET_MESSAGES_LIST, ELEMENTS_PER_REQUEST) {
    function _prepareThreads(data) {
      var threads = data[0],
          messages = data[1];

      messages.forEach(function(message) {
        _.assign(_.find(threads, { id: message.threadId }), { email: Email(message), date: message.date });
      });

      return threads;
    }

    return newInboxProvider({
      name: 'inboxHostedMailThreadsProvider',
      fetch: function(container) {
        return pagedJmapRequest(function(position) {
          return withJmapClient(function(client) {
            return client.getMessageList({
              filter: {
                inMailboxes: [container]
              },
              sort: ['date desc'],
              collapseThreads: true,
              fetchThreads: false,
              fetchMessages: false,
              position: position,
              limit: ELEMENTS_PER_REQUEST
            })
              .then(function(messageList) {
                return $q.all([
                  messageList.getThreads({ fetchMessages: false }),
                  messageList.getMessages({ properties: JMAP_GET_MESSAGES_LIST })
                ]);
              })
              .then(_prepareThreads);
          });
        });
      },
      getDefaultContainer: findInboxMailboxId,
      templateUrl: '/unifiedinbox/views/unified-inbox/elements/thread'
    });
  })

  .factory('pagedJmapRequest', function() {
    return function(loadNextItems) {
      var position = 0;

      return function() {
        return loadNextItems(position)
          .then(function(results) {
            position += results.length;

            return results;
          });
      };
    };
  });
