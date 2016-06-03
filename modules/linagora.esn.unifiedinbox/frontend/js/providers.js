'use strict';

angular.module('linagora.esn.unifiedinbox')

  .factory('inboxDefaultProviderContext', function(withJmapClient, jmap) {
    return function() {
      return withJmapClient(function(client) {
        return client
          .getMailboxWithRole(jmap.MailboxRole.INBOX)
          .then(function(mailbox) {
            return {
              inMailboxes: [mailbox.id]
            };
          });
      });
    };
  })

  .factory('inboxProviders', function(Providers) {
    return new Providers();
  })

  .factory('inboxTwitterProvider', function($q, $http, newProvider, _, ELEMENTS_PER_REQUEST, PROVIDER_TYPES) {
    return function(accountId) {
      return newProvider({
        type: PROVIDER_TYPES.SOCIAL,
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
        buildFetchContext: function() { return $q.when(); },
        templateUrl: '/unifiedinbox/views/unified-inbox/elements/tweet'
      });
    };
  })

  .factory('inboxHostedMailMessagesProvider', function(withJmapClient, Email, pagedJmapRequest, inboxDefaultProviderContext,
                                                       newProvider, JMAP_GET_MESSAGES_LIST, ELEMENTS_PER_REQUEST, PROVIDER_TYPES) {
    return newProvider({
      type: PROVIDER_TYPES.JMAP,
      name: 'inboxHostedMailMessagesProvider',
      fetch: function(filter) {
        return pagedJmapRequest(function(position) {
          return withJmapClient(function(client) {
            return client.getMessageList({
              filter: filter,
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
      buildFetchContext: inboxDefaultProviderContext,
      templateUrl: '/unifiedinbox/views/unified-inbox/elements/message'
    });
  })

  .factory('inboxHostedMailThreadsProvider', function($q, withJmapClient, pagedJmapRequest, Email, Thread, _, inboxDefaultProviderContext,
                                                      newProvider, JMAP_GET_MESSAGES_LIST, ELEMENTS_PER_REQUEST, PROVIDER_TYPES) {
    function _prepareThreads(data) {
      var threads = data[0],
          messages = data[1];

      messages.forEach(function(message) {
        _.assign(_.find(threads, { id: message.threadId }), { email: Email(message), date: message.date });
      });

      return threads;
    }

    return newProvider({
      type: PROVIDER_TYPES.JMAP,
      name: 'inboxHostedMailThreadsProvider',
      fetch: function(filter) {
        return pagedJmapRequest(function(position) {
          return withJmapClient(function(client) {
            return client.getMessageList({
              filter: filter,
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
              .then(_prepareThreads)
              .then(function(threads) {
                return threads.map(function(thread) {
                  return new Thread(thread, [thread.email]);
                });
              });
          });
        });
      },
      buildFetchContext: inboxDefaultProviderContext,
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
