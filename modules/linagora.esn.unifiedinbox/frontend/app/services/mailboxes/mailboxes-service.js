(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .constant('INBOX_RESTRICTED_MAILBOXES', [
      'outbox',
      'drafts'
    ])

    .factory('inboxMailboxesService', function($q, _, withJmapClient, jmap, inboxSpecialMailboxes, inboxMailboxesCache,
                                          asyncJmapAction, Mailbox,
                                          MAILBOX_LEVEL_SEPARATOR, INBOX_RESTRICTED_MAILBOXES) {

      return {
        filterSystemMailboxes: filterSystemMailboxes,
        assignMailboxesList: assignMailboxesList,
        assignMailbox: assignMailbox,
        flagIsUnreadChanged: flagIsUnreadChanged,
        moveUnreadMessages: moveUnreadMessages,
        canMoveMessage: canMoveMessage,
        getMessageListFilter: getMessageListFilter,
        createMailbox: createMailbox,
        destroyMailbox: destroyMailbox,
        updateMailbox: updateMailbox,
        isRestrictedMailbox: isRestrictedMailbox
      };

      /////

      function filterSystemMailboxes(mailboxes) {
        return _.reject(mailboxes, function(mailbox) { return mailbox.role.value; });
      }

      function qualifyMailbox(mailbox) {
        var parent = mailbox;

        mailbox.level = 1;
        mailbox.qualifiedName = mailbox.name;

        parent = _findMailboxInCache(parent.parentId);

        while (parent) {
          mailbox.qualifiedName = parent.name + MAILBOX_LEVEL_SEPARATOR + mailbox.qualifiedName;
          mailbox.level++;

          parent = _findMailboxInCache(parent.parentId);
        }

        return Mailbox(mailbox);
      }

      function _updateUnreadMessages(mailboxIds, adjust) {
        mailboxIds.forEach(function(id) {
          var mailbox = _findMailboxInCache(id);

          if (mailbox) {
            mailbox.unreadMessages = Math.max(mailbox.unreadMessages + adjust, 0);
          }
        });
      }

      function _updateMailboxCache(mailboxes) {
        if (!angular.isArray(mailboxes)) {
          mailboxes = [mailboxes];
        }

        mailboxes.forEach(function(mailbox) {
          var index = _.findIndex(inboxMailboxesCache, { id: mailbox.id }),
            targetIndexInCache = index > -1 ? index : inboxMailboxesCache.length;

          inboxMailboxesCache[targetIndexInCache] = mailbox;
        });

        inboxMailboxesCache.forEach(function(mailbox, index, cache) {
          cache[index] = qualifyMailbox(mailbox);
        });

        return inboxMailboxesCache;
      }

      function _findMailboxInCache(id) {
        return id && _.find(inboxMailboxesCache, { id: id });
      }

      function _removeMailboxesFromCache(ids) {
        if (!angular.isArray(ids)) {
          ids = [ids];
        }

        return _.remove(inboxMailboxesCache, function(mailbox) {
          return _.indexOf(ids, mailbox.id) > -1;
        });
      }

      function _assignToObject(object, attr) {
        return function(value) {
          if (object && !object[attr]) {
            object[attr] = value;
          }

          return value;
        };
      }

      function assignMailbox(id, dst, useCache) {
        var localMailbox = inboxSpecialMailboxes.get(id) || (useCache && _findMailboxInCache(id));

        if (localMailbox) {
          return $q.when(_assignToObject(dst, 'mailbox')(localMailbox));
        }

        return withJmapClient(function(client) {
          return client.getMailboxes({ ids: [id] })
            .then(_.head) // We expect a single mailbox here
            .then(_updateMailboxCache)
            .then(_findMailboxInCache.bind(null, id))
            .then(_assignToObject(dst, 'mailbox'));
        });
      }

      function assignMailboxesList(dst, filter) {
        return withJmapClient(function(jmapClient) {
          return jmapClient.getMailboxes()
            .then(_updateMailboxCache)
            .then(filter || _.identity)
            .then(_assignToObject(dst, 'mailboxes'));
        });
      }

      function flagIsUnreadChanged(email, status) {
        if (email && angular.isDefined(status)) {
          _updateUnreadMessages(email.mailboxIds, status ? 1 : -1);
        }
      }

      function moveUnreadMessages(fromMailboxIds, toMailboxIds, numberOfUnreadMessage) {
        _updateUnreadMessages(fromMailboxIds, -numberOfUnreadMessage);
        _updateUnreadMessages(toMailboxIds, numberOfUnreadMessage);
      }

      function isRestrictedMailbox(mailbox) {
        if (mailbox && mailbox.role) {
          return INBOX_RESTRICTED_MAILBOXES.indexOf(mailbox.role.value) > -1;
        }

        return false;
      }

      function canMoveMessage(message, toMailbox) {
        // do not allow moving draft message
        if (message.isDraft) {
          return false;
        }

        // do not allow moving to the same mailbox
        if (message.mailboxIds.indexOf(toMailbox.id) > -1) {
          return false;
        }

        // do not allow moving to special mailbox
        if (_isSpecialMailbox(toMailbox.id)) {
          return false;
        }

        // do not allow moving to restricted mailboxes
        if (isRestrictedMailbox(toMailbox)) {
          return false;
        }

        // do not allow moving out restricted mailboxes
        return message.mailboxIds.every(function(mailboxId) {
          return !isRestrictedMailbox(_.find(inboxMailboxesCache, { id: mailboxId }));
        });

      }

      function getMessageListFilter(mailboxId) {
        var specialMailbox = inboxSpecialMailboxes.get(mailboxId);
        var filter;

        if (specialMailbox) {
          filter = specialMailbox.filter;

          if (filter && filter.unprocessed) {
            return _mailboxRolesToIds(filter.notInMailboxes)
              .then(function(ids) {
                delete filter.unprocessed;
                filter.notInMailboxes = ids;

                return filter;
              });
          }
        } else {
          filter = { inMailboxes: [mailboxId] };
        }

        return $q.when(filter);
      }

      function _isSpecialMailbox(mailboxId) {
        return !!inboxSpecialMailboxes.get(mailboxId);
      }

      function _mailboxRolesToIds(roles) {
        return withJmapClient(function(jmapClient) {
          return jmapClient.getMailboxes()
            .then(function(mailboxes) {
              return roles
                .map(function(role) {
                  return _.find(mailboxes, { role: role });
                })
                .filter(Boolean)
                .map(_.property('id'));
            })
            .catch(_.constant([]));
        });
      }

      function createMailbox(mailbox, onFailure) {
        return asyncJmapAction('Creation of folder ' + mailbox.name, function(client) {
          return client.createMailbox(mailbox.name, mailbox.parentId);
        }, {
          onFailure: onFailure
        })
          .then(_updateMailboxCache);
      }

      function destroyMailbox(mailbox) {
        var ids = _(mailbox.descendants)
          .map(_.property('id'))
          .reverse()
          .push(mailbox.id)
          .value(); // According to JMAP spec, the X should be removed before Y if X is a descendent of Y

        return asyncJmapAction('Deletion of folder ' + mailbox.displayName, function(client) {
          return client.setMailboxes({ destroy: ids })
            .then(function(response) {
              _removeMailboxesFromCache(response.destroyed);

              if (response.destroyed.length !== ids.length) {
                return $q.reject('Expected ' + ids.length + ' successfull deletions, but got ' + response.destroyed.length + '.');
              }
            });
        });
      }

      function updateMailbox(oldMailbox, newMailbox) {
        return asyncJmapAction('Modification of folder ' + oldMailbox.displayName, function(client) {
          return client.updateMailbox(oldMailbox.id, {
            name: newMailbox.name,
            parentId: newMailbox.parentId
          });
        })
          .then(_.assign.bind(null, oldMailbox, newMailbox))
          .then(_updateMailboxCache);
      }
    });

})();
