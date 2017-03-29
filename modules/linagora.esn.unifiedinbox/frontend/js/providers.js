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

  .factory('rejectItemById', function(_) {
    return function(item) {
      return function(items) {
        return item ? _.reject(items, { id: item.id }) : items;
      };
    };
  })

  .factory('newInboxTwitterProvider', function($q, $http, newProvider, rejectItemById, inboxFilteredList, _,
                                               ELEMENTS_PER_REQUEST, PROVIDER_TYPES) {
    return function(id, accountId, url) {
      var provider = newProvider({
        id: id,
        account: accountId,
        types: [PROVIDER_TYPES.SOCIAL, PROVIDER_TYPES.TWITTER],
        name: 'Tweets',
        fetch: function() {
          function fetcher(newestTweet) {
            return $http.get(url, { params: buildQueryParameters(newestTweet) }).then(_.property('data'));
          }

          fetcher.loadRecentItems = function(newestTweet) {
            return fetcher(newestTweet).then(rejectItemById(newestTweet));
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

      function buildQueryParameters(newestTweet) {
        var oldestTweet = !newestTweet && inboxFilteredList.getOldestProviderItem(provider);

        return {
          account_id: accountId,
          count: ELEMENTS_PER_REQUEST * 2, // Because count may not be what you think -> https://dev.twitter.com/rest/reference/get/statuses/mentions_timeline
          max_id: oldestTweet ? oldestTweet.id : null,
          since_id: newestTweet ? newestTweet.id : null
        };
      }

      return provider;
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

  .factory('newInboxMessageProvider', function($q, withJmapClient, inboxJmapProviderContextBuilder, inboxFilteredList,
                                               newProvider, sortByDateInDescendingOrder, inboxMailboxesService, rejectItemById, _,
                                               JMAP_GET_MESSAGES_LIST, ELEMENTS_PER_REQUEST, PROVIDER_TYPES) {
    return function(templateUrl) {
      var provider = newProvider({
        type: PROVIDER_TYPES.JMAP,
        name: 'Emails',
        fetch: function(context) {
          function fetcher(newestItem) {
            return withJmapClient(function(client) {
              return client.getMessageList({
                filter: buildGetMessageListFilter(context, newestItem),
                sort: ['date desc'],
                collapseThreads: false,
                fetchMessages: false,
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

          fetcher.loadRecentItems = function(newestItem) {
            return fetcher(newestItem)
              .then(rejectItemById(newestItem))
              .then(function(messages) {
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

      function buildGetMessageListFilter(context, newestItem) {
        var oldestItem = !newestItem && inboxFilteredList.getOldestProviderItem(provider);

        return _.extend({}, context, {
          after: newestItem ? newestItem.date : null,
          before: oldestItem ? oldestItem.date : null
        });
      }

      return provider;
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
