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

  .factory('inboxTwitterProvider', function($q, inboxRestangular) {
    return function(accountId) {
      return {
        fetch: function() {
          return function(position, limit) {
            /*var params = angular.extend({ account_id: accountId }, { count: limit });

            return inboxRestangular.one('inbox').customGETLIST('tweets', params);*/
            return $q.when([
              {
                id:709749105527013400,
                author:{
                  id:278458528,
                  displayName:'Alexandre Zapolsky',
                  avatar:'https://pbs.twimg.com/profile_images/676024287023747072/NuEUA74v.jpg'
                },
                date: Date.now(),
                text:'On dirait des étudiants de @@TELECOMNancy  ! \nAh bravo @charoy : Quel beau voyage dans le temps tu leur offre !\n@linagora @AwesomePaaS'
              },
              {
                id:682449283975520300,
                author:{
                  id:1717809529,
                  displayName:'Ajay Pandey',
                  avatar:'https://pbs.twimg.com/profile_images/378800000393742200/e1420f8af51bc00377acfe4ab6172cf2.jpeg'
                },
                rcpt:{
                  id:2423453340,
                  displayName:'Open PaaS',
                  avatar:'https://pbs.twimg.com/profile_images/484319141940064256/k5iuYBQF.png'
                },
                date: Date.now() - 3600000,
                text:'Hello  Increase your twitter 782 followers\n\n||||-VISIT SITE-|||| -&gt;https://t.co/vTDKAn8VMP\n\nThank you for following  @pandeyajay7'
              }
            ]);
          };
        },
        getDefaultContainer: function() { return $q.when(); },
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
