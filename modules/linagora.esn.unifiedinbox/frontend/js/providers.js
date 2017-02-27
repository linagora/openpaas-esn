'use strict';

angular.module('linagora.esn.unifiedinbox')

  .factory('inboxJmapProviderContextBuilder', function($q, withJmapClient, jmap, PROVIDER_TYPES) {
    return function(options) {
      if (angular.isDefined(options.query)) {
        return $q.when({ text: options.query });
      }

      return withJmapClient(function(client) {
        return client
          .getMailboxWithRole(jmap.MailboxRole.INBOX)
          .then(function(mailbox) {
            return angular.extend({}, { inMailboxes: [mailbox.id] }, options.filterByType[PROVIDER_TYPES.JMAP]);
          });
      });
    };
  })

  .factory('inboxProviders', function(Providers) {
    return new Providers();
  })

  .factory('newInboxTwitterProvider', function($q, $http, newProvider, _, ELEMENTS_PER_REQUEST, PROVIDER_TYPES) {
    return function(id, accountId, url) {
      return newProvider({
        id: id + accountId,
        types: [PROVIDER_TYPES.SOCIAL, PROVIDER_TYPES.TWITTER],
        name: 'Tweets',
        fetch: function() {
          var oldestTweetId = null;

          return function() {
            return $http
              .get(url, {
                params: {
                  account_id: accountId,
                  count: ELEMENTS_PER_REQUEST * 2, // Because count may not be what you think -> https://dev.twitter.com/rest/reference/get/statuses/mentions_timeline
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

  .factory('inboxTwitterMentionsProvider', function(newInboxTwitterProvider) {
    return function(accountId) {
      return newInboxTwitterProvider('inboxTwitterMentions', accountId, '/unifiedinbox/api/inbox/twitter/mentions');
    };
  })

  .factory('inboxTwitterDirectMessagesProvider', function(newInboxTwitterProvider) {
    return function(accountId) {
      return newInboxTwitterProvider('inboxTwitterDirectMessages', accountId, '/unifiedinbox/api/inbox/twitter/directmessages');
    };
  })

  .factory('newInboxMessageProvider', function(withJmapClient, Email, pagedJmapRequest, inboxJmapProviderContextBuilder,
                                                       newProvider, JMAP_GET_MESSAGES_LIST, ELEMENTS_PER_REQUEST, PROVIDER_TYPES) {
    return function(templateUrl) {
      return newProvider({
        type: PROVIDER_TYPES.JMAP,
        name: 'Emails',
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
        buildFetchContext: inboxJmapProviderContextBuilder,
        templateUrl: templateUrl
      });
    };
  })

  .factory('inboxHostedMailMessagesProvider', function(newInboxMessageProvider) {
    return newInboxMessageProvider('/unifiedinbox/views/unified-inbox/elements/message');
  })

  .factory('inboxSearchResultsProvider', function(newInboxMessageProvider) {
    return newInboxMessageProvider('/unifiedinbox/views/unified-inbox/elements/search');
  })

  .factory('inboxHostedMailAttachmentProvider', function(withJmapClient, pagedJmapRequest, newProvider, ByDateElementGroupingTool,
                                                         inboxFilteringService, mailboxesService, inboxJmapProviderContextBuilder,
                                                         JMAP_GET_MESSAGES_ATTACHMENTS_LIST, ELEMENTS_PER_REQUEST, PROVIDER_TYPES) {
    return newProvider({
      type: PROVIDER_TYPES.JMAP,
      name: 'Attachments',
      fetch: function(filter) {
        return pagedJmapRequest(function(position) {
          return withJmapClient(function(client) {
            return client.getMessageList({
              filter: angular.extend(filter, { hasAttachment: true}),
              sort: ['date desc'],
              collapseThreads: false,
              fetchMessages: false,
              position: position,
              limit: ELEMENTS_PER_REQUEST
            })
              .then(function(messageList) {
                return messageList.getMessages({ properties: JMAP_GET_MESSAGES_ATTACHMENTS_LIST });
              });
          });
        });
      },
      buildFetchContext: function(options) {
        return (options.id && mailboxesService.getMessageListFilter(options.id)) || inboxJmapProviderContextBuilder(options);
      },
      templateUrl: '/unifiedinbox/views/components/sidebar/attachment/sidebar-attachment-item'
    });
  })

  .factory('inboxHostedMailThreadsProvider', function($q, withJmapClient, pagedJmapRequest, Email, Thread, _, inboxJmapProviderContextBuilder,
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
      buildFetchContext: inboxJmapProviderContextBuilder,
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
