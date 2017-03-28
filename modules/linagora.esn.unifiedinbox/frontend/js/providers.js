'use strict';

angular.module('linagora.esn.unifiedinbox')

  .factory('inboxJmapProviderContextBuilder', function($q, inboxMailboxesService, jmap, PROVIDER_TYPES) {
    return function(options) {
      if (angular.isDefined(options.query)) {
        return $q.when({ text: options.query });
      }

      return inboxMailboxesService.getMessageListFilter(options.context).then(function(mailboxFilter) {
        return angular.extend(mailboxFilter, options.filterByType[PROVIDER_TYPES.JMAP]);
      });
    };
  })

  .factory('inboxProviders', function(Providers) {
    return new Providers();
  })

  .factory('newInboxTwitterProvider', function($q, $http, newProvider, _, ELEMENTS_PER_REQUEST, PROVIDER_TYPES) {
    return function(id, accountId, url) {
      return newProvider({
        id: id,
        account: accountId,
        types: [PROVIDER_TYPES.SOCIAL, PROVIDER_TYPES.TWITTER],
        name: 'Tweets',
        fetch: function() {
          var oldestTweetId = null,
              fetcher = function(mostRecentTweetId) {
                return $http
                  .get(url, {
                    params: {
                      account_id: accountId,
                      count: ELEMENTS_PER_REQUEST * 2, // Because count may not be what you think -> https://dev.twitter.com/rest/reference/get/statuses/mentions_timeline
                      max_id: mostRecentTweetId ? null : oldestTweetId,
                      since_id: mostRecentTweetId
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

          fetcher.loadRecentItems = function(mostRecentTweet) {
            return fetcher(mostRecentTweet.id);
          };

          return fetcher;
        },
        buildFetchContext: function() { return $q.when(); },
        templateUrl: '/unifiedinbox/views/unified-inbox/elements/tweet',
        itemMatches: function(item, filters) {
          return $q(function(resolve, reject) {
            if (!filters.acceptedIds) {
              return resolve();
            }

            _.contains(filters.acceptedIds, id) ? resolve() : reject();
          });
        }
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

  .factory('newInboxMessageProvider', function($q, withJmapClient, pagedJmapRequest, inboxJmapProviderContextBuilder,
                                               newProvider, sortByDateInDescendingOrder, inboxMailboxesService, _,
                                               JMAP_GET_MESSAGES_LIST, ELEMENTS_PER_REQUEST, PROVIDER_TYPES) {
    return function(templateUrl) {
      return newProvider({
        type: PROVIDER_TYPES.JMAP,
        name: 'Emails',
        fetch: function(context) {
          function getMessages(position, dateOfMostRecentItem) {
            return withJmapClient(function(client) {
              return client.getMessageList({
                filter: dateOfMostRecentItem ? angular.extend({}, context, { after: dateOfMostRecentItem }) : context,
                sort: ['date desc'],
                collapseThreads: false,
                fetchMessages: false,
                position: position,
                limit: ELEMENTS_PER_REQUEST
              })
                .then(function(messageList) {
                  if (messageList.messageIds.length === 0) {
                    return [];
                  }

                  return messageList.getMessages({ properties: JMAP_GET_MESSAGES_LIST });
                })
                .then(function(messages) {
                  return messages.sort(sortByDateInDescendingOrder); // We need to sort here because the backend might return shuffled messages
                });
            });
          }

          var fetcher = pagedJmapRequest(getMessages);

          fetcher.loadRecentItems = function(mostRecentItem) {
            return getMessages(0, mostRecentItem.date).then(function(messages) {
              messages.forEach(function(message) {
                if (message.isUnread) {
                  inboxMailboxesService.flagIsUnreadChanged(message, true);
                }
              });

              return messages;
            });
          };

          return fetcher;
        },
        buildFetchContext: inboxJmapProviderContextBuilder,
        itemMatches: function(item, filters) {
          return $q(function(resolve, reject) {
            var context = filters.context,
                mailboxIds = item.mailboxIds,
                filter = filters.filterByType[PROVIDER_TYPES.JMAP];

            inboxMailboxesService.getMessageListFilter(context).then(function(mailboxFilter) {
              if ((_.isEmpty(mailboxFilter.notInMailboxes) || _.intersection(mailboxIds, mailboxFilter.notInMailboxes).length === 0) &&
                  (_.isEmpty(mailboxFilter.inMailboxes) || _.intersection(mailboxIds, mailboxFilter.inMailboxes).length > 0) &&
                  (_.isEmpty(filter) || _.find([item], filter))) {
                return resolve();
              }

              reject();
            });
          });
        },
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
                                                         inboxFilteringService, inboxMailboxesService, inboxJmapProviderContextBuilder,
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
        return (options.id && inboxMailboxesService.getMessageListFilter(options.id)) || inboxJmapProviderContextBuilder(options);
      },
      templateUrl: '/unifiedinbox/views/components/sidebar/attachment/sidebar-attachment-item'
    });
  })

  .factory('inboxHostedMailThreadsProvider', function($q, withJmapClient, pagedJmapRequest, _, inboxJmapProviderContextBuilder,
                                                      newProvider, JMAP_GET_MESSAGES_LIST, ELEMENTS_PER_REQUEST, PROVIDER_TYPES) {
    function _prepareThreads(data) {
      var threads = data[0],
          messages = data[1];

      messages.forEach(function(message) {
        _.find(threads, { id: message.threadId }).emails = [message];
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
              .then(_prepareThreads);
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
