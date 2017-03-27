'use strict';

angular.module('linagora.esn.unifiedinbox')

  .factory('inboxConfig', function(esnConfig, INBOX_MODULE_NAME) {
    return function(key, defaultValue) {
      return esnConfig(INBOX_MODULE_NAME + '.' + key, defaultValue);
    };
  })

  .factory('generateJwtToken', function($http, _) {
    return function() {
      return $http.post('/api/jwt/generate').then(_.property('data'));
    };
  })

  .service('jmapClientProvider', function($q, inboxConfig, jmap, dollarHttpTransport, dollarQPromiseProvider, generateJwtToken) {
    var jmapClient;

    function _initializeJmapClient() {
      return $q.all([
        generateJwtToken(),
        inboxConfig('api'),
        inboxConfig('downloadUrl')
      ]).then(function(data) {
        jmapClient = new jmap.Client(dollarHttpTransport, dollarQPromiseProvider)
          .withAPIUrl(data[1])
          .withDownloadUrl(data[2])
          .withAuthenticationToken('Bearer ' + data[0]);
        return jmapClient;
      });
    }

    function get() {
      return jmapClient ? $q.when(jmapClient) : _initializeJmapClient();
    }

    return {
      get: get
    };
  })

  .factory('withJmapClient', function(jmapClientProvider) {
    return function(callback) {
      return jmapClientProvider.get().then(callback);
    };
  })

  .factory('backgroundAction', function(asyncAction, inBackground) {
    return function(message, action, options) {
      return asyncAction(message, function() {
        return inBackground(action());
      }, options);
    };
  })

  .factory('asyncJmapAction', function(backgroundAction, withJmapClient) {
    return function(message, action, options) {
      return backgroundAction(message, function() {
        return withJmapClient(action);
      }, options);
    };
  })

  .factory('sendEmail', function($http, $q, inboxConfig, inBackground, jmap, withJmapClient, jmapHelper, inboxMailboxesService) {
    function sendBySmtp(email) {
      return $http.post('/unifiedinbox/api/inbox/sendemail', email);
    }

    function sendByJmapMovingDraftToOutbox(client, message) {
      return $q.all([
          client.saveAsDraft(message),
          inboxMailboxesService.getMailboxWithRole(jmap.MailboxRole.OUTBOX)
        ]).then(function(data) {
          return client.moveMessage(data[0].id, [data[1].id]);
        });
    }

    function sendByJmapDirectlyToOutbox(client, message) {
      return inboxMailboxesService.getMailboxWithRole(jmap.MailboxRole.OUTBOX).then(function(outbox) {
        return client.send(message, outbox);
      });
    }

    function sendEmail(email) {
      return withJmapClient(function(client) {
        return $q.all([
          inboxConfig('isJmapSendingEnabled'),
          inboxConfig('isSaveDraftBeforeSendingEnabled')
        ]).then(function(data) {
          var isJmapSendingEnabled = data[0],
              isSaveDraftBeforeSendingEnabled = data[1],
              message = jmapHelper.toOutboundMessage(client, email);

          if (!isJmapSendingEnabled) {
            return sendBySmtp(message);
          } else if (isSaveDraftBeforeSendingEnabled) {
            return sendByJmapMovingDraftToOutbox(client, message);
          }

          return sendByJmapDirectlyToOutbox(client, message);
        });
      });
    }

    return function(email) {
      return inBackground(sendEmail(email));
    };
  })

  .factory('jmapHelper', function(jmap, session, emailBodyService, userUtils, withJmapClient, backgroundAction, _,
                                  JMAP_GET_MESSAGES_VIEW) {
    function _mapToEMailer(recipients) {
      return (recipients || []).map(function(recipient) {
        return new jmap.EMailer({
          name: recipient.name,
          email: recipient.email
        });
      });
    }

    function toOutboundMessage(jmapClient, emailState) {
      var message = {
        from: new jmap.EMailer({
          email: session.user.preferredEmail,
          name: userUtils.displayNameOf(session.user)
        }),
        subject: emailState.subject,
        to: _mapToEMailer(emailState.to),
        cc: _mapToEMailer(emailState.cc),
        bcc: _mapToEMailer(emailState.bcc)
      };
      var bodyProperty = emailState.htmlBody ? 'htmlBody' : emailBodyService.bodyProperty;

      message[bodyProperty] = emailState[bodyProperty];

      if (emailState.attachments) {
        message.attachments = (emailState.attachments || []).filter(function(attachment) {
          return attachment.blobId;
        });
      }

      return new jmap.OutboundMessage(jmapClient, message);
    }

    function getMessageById(id) {
      return withJmapClient(function(client) {
        return client
          .getMessages({ ids: [id], properties: JMAP_GET_MESSAGES_VIEW })
          .then(_.head);
      });
    }

    return {
      getMessageById: getMessageById,
      toOutboundMessage: toOutboundMessage
    };
  })

  .factory('emailSendingService', function($q, emailService, jmap, _, session, emailBodyService, sendEmail, jmapHelper) {

    /**
     * Add the following logic when sending an email: Check for an invalid email used as a recipient
     *
     * @param {Object} email
     */
    function emailsAreValid(email) {
      if (!email) {
        return false;
      }

      return [].concat(email.to || [], email.cc || [], email.bcc || []).every(function(recipient) {
        return emailService.isValidEmail(recipient.email);
      });
    }

    /**
     * Add the following logic when sending an email:
     *  Add the same recipient multiple times, in multiples fields (TO, CC...): allowed.
     *  This multi recipient must receive the email as a TO > CC > BCC recipient in this order.
     *  If the person is in TO and CC, s/he receives as TO. If s/he is in CC/BCC, receives as CC, etc).
     *
     * @param {Object} email
     */
    function removeDuplicateRecipients(email) {
      var notIn = function(array) {
        return function(item) {
          return !_.find(array, { email: item.email });
        };
      };

      if (!email) {
        return;
      }

      email.to = email.to || [];
      email.cc = (email.cc || []).filter(notIn(email.to));
      email.bcc = (email.bcc || []).filter(notIn(email.to)).filter(notIn(email.cc));
    }

    function countRecipients(email) {
      if (!email) {
        return 0;
      }

      return _.size(email.to) + _.size(email.cc) + _.size(email.bcc);
    }

    /**
     * Add the following logic to email sending:
     *  Check whether the user is trying to send an email with no recipient at all
     *
     * @param {Object} email
     */
    function noRecipient(email) {
      return countRecipients(email) === 0;
    }

    function prefixSubject(subject, prefix) {
      if (!subject || !prefix) {
        return subject;
      }

      if (prefix.indexOf(' ', prefix.length - 1) === -1) {
        prefix = prefix + ' ';
      }

      if (subject.slice(0, prefix.length) === prefix) {
        return subject;
      }

      return prefix + subject;
    }

    function getFirstRecipient(email) {
        return _.head(email.to) || _.head(email.cc) || _.head(email.bcc);
    }

    function showReplyAllButton(email) {
      var nbRecipients = countRecipients(email);

      return nbRecipients > 1 || nbRecipients === 1 && getEmailAddress(getFirstRecipient(email)) !== getEmailAddress(session.user);
    }

    function getEmailAddress(recipient) {
      if (recipient) {
        return recipient.email || recipient.preferredEmail;
      }
    }

    function getReplyToRecipients(email) {
      var replyTo = _.reject(email.replyTo, { email: jmap.EMailer.unknown().email });

      return replyTo.length > 0 ? replyTo : [email.from];
    }

    function getReplyAllRecipients(email, sender) {
      function notMe(item) {
        return item.email !== getEmailAddress(sender);
      }

      if (!email || !sender) {
        return;
      }

      return {
        to: _(email.to || []).concat(getReplyToRecipients(email)).uniq('email').value().filter(notMe),
        cc: (email.cc || []).filter(notMe),
        bcc: email.bcc || []
      };
    }

    function getReplyRecipients(email) {
      if (!email) {
        return;
      }

      return {
        to: getReplyToRecipients(email),
        cc: [],
        bcc: []
      };
    }

    function _enrichWithQuote(email, body) {
      if (emailBodyService.supportsRichtext()) {
        email.htmlBody = body;
      } else {
        email.textBody = body;
      }

      email.isQuoting = true;

      return email;
    }

    function _createQuotedEmail(subjectPrefix, recipients, templateName, includeAttachments, messageId, sender) {
      return jmapHelper.getMessageById(messageId).then(function(message) {
        var newRecipients = recipients ? recipients(message, sender) : {},
            newEmail = {
              from: getEmailAddress(sender),
              to: newRecipients.to || [],
              cc: newRecipients.cc || [],
              bcc: newRecipients.bcc || [],
              subject: prefixSubject(message.subject, subjectPrefix),
              quoted: message,
              isQuoting: false,
              quoteTemplate: templateName
            };

        includeAttachments && (newEmail.attachments = message.attachments);

        // We do not automatically quote the message if we're using a plain text editor and the message
        // has a HTML body. In this case the "Edit Quoted Mail" button will show
        if (!emailBodyService.supportsRichtext() && message.htmlBody) {
          return emailBodyService.quote(newEmail, templateName, true).then(function(body) {
            newEmail.quoted.htmlBody = body;

            return newEmail;
          });
        }

        return emailBodyService.quote(newEmail, templateName).then(function(body) {
          return _enrichWithQuote(newEmail, body);
        });
      });
    }

    return {
      emailsAreValid: emailsAreValid,
      removeDuplicateRecipients: removeDuplicateRecipients,
      noRecipient: noRecipient,
      sendEmail: sendEmail,
      prefixSubject: prefixSubject,
      getReplyRecipients: getReplyRecipients,
      getReplyAllRecipients: getReplyAllRecipients,
      getFirstRecipient: getFirstRecipient,
      showReplyAllButton: showReplyAllButton,
      createReplyAllEmailObject: _createQuotedEmail.bind(null, 'Re: ', getReplyAllRecipients, 'default', false),
      createReplyEmailObject: _createQuotedEmail.bind(null, 'Re: ', getReplyRecipients, 'default', false),
      createForwardEmailObject: _createQuotedEmail.bind(null, 'Fwd: ', null, 'forward', true),
      countRecipients: countRecipients
    };
  })

  .service('draftService', function($q, asyncJmapAction, emailBodyService, _,
                                    jmapHelper, waitUntilMessageIsComplete, ATTACHMENTS_ATTRIBUTES) {

    function _keepSomeAttributes(array, attibutes) {
      return _.map(array, function(data) {
        return _.pick(data, attibutes);
      });
    }

    function haveDifferentRecipients(left, right) {
      return _.xor(_.map(left, 'email'), _.map(right, 'email')).length > 0;
    }

    function haveDifferentBodies(original, newest) {
      return trim(original[emailBodyService.bodyProperty]) !== trim(newest[emailBodyService.bodyProperty]);
    }

    function haveDifferentAttachments(original, newest) {
      return !_.isEqual(_keepSomeAttributes(original, ATTACHMENTS_ATTRIBUTES), _keepSomeAttributes(newest, ATTACHMENTS_ATTRIBUTES));
    }

    function trim(value) {
      return (value || '').trim();
    }

    function Draft(originalEmailState) {
      this.originalEmailState = angular.copy(originalEmailState);
    }

    Draft.prototype.needToBeSaved = function(newEmailState) {
      var original = this.originalEmailState || {},
          newest = newEmailState || {};

      return (
        trim(original.subject) !== trim(newest.subject) ||
        haveDifferentBodies(original, newest) ||
        haveDifferentRecipients(original.to, newest.to) ||
        haveDifferentRecipients(original.cc, newest.cc) ||
        haveDifferentRecipients(original.bcc, newest.bcc) ||
        haveDifferentAttachments(original.attachments, newest.attachments)
      );
    };

    Draft.prototype.save = function(email, options) {
      var partial = options && options.partial;

      if (!this.needToBeSaved(email)) {
        return $q.reject('No changes detected in current draft');
      }

      return asyncJmapAction('Saving your email as draft', function(client) {
        function doSave() {
          var copy = angular.copy(email);

          return client.saveAsDraft(jmapHelper.toOutboundMessage(client, copy, options))
            .then(function(ack) {
              copy.id = ack.id;

              return copy;
            });
        }

        return partial ? doSave() : waitUntilMessageIsComplete(email).then(doSave);
      }, options);
    };

    Draft.prototype.destroy = function() {
      var id = this.originalEmailState.id;

      if (id) {
        return asyncJmapAction('Destroying a draft', function(client) {
          return client.destroyMessage(id);
        }, { silent: true });
      }

      return $q.when();
    };

    return {
      startDraft: function(originalEmailState) {
        return new Draft(originalEmailState);
      }
    };
  })

  .service('newComposerService', function($state, jmapHelper, boxOverlayOpener, deviceDetector) {
    var defaultTitle = 'New message';

    function choseByPlatform(mobile, others) {
      deviceDetector.isMobile() ? mobile() : others();
    }

    function newMobileComposer(email, compositionOptions) {
      $state.go('unifiedinbox.compose', {
        email: email,
        compositionOptions: compositionOptions
      });
    }

    function newBoxedComposerCustomTitle(email, compositionOptions) {
      boxOverlayOpener.open({
        id: email && email.id,
        title: defaultTitle,
        templateUrl: '/unifiedinbox/views/composer/box-compose.html',
        email: email,
        compositionOptions: compositionOptions
      });
    }

    function newBoxedDraftComposer(email) {
      newBoxedComposerCustomTitle(email);
    }

    function open(email, compositionOptions) {
      choseByPlatform(
        newMobileComposer.bind(null, email, compositionOptions),
        newBoxedComposerCustomTitle.bind(null, email, compositionOptions)
      );
    }

    function openDraft(id) {
      jmapHelper.getMessageById(id).then(function(message) {
        choseByPlatform(
          newMobileComposer.bind(this, message),
          newBoxedDraftComposer.bind(this, message)
        );
      });
    }

    return {
      open: open,
      openDraft: openDraft
    };
  })

  .factory('Composition', function($q, $timeout, draftService, emailSendingService, notificationFactory, Offline,
                                   backgroundAction, emailBodyService, waitUntilMessageIsComplete, newComposerService,
                                   DRAFT_SAVING_DEBOUNCE_DELAY, gracePeriodService, _, inboxConfig) {

    function prepareEmail(email) {
      var clone = angular.copy(email = email || {});

      ['to', 'cc', 'bcc', 'attachments'].forEach(function(key) {
        clone[key] = _.clone(email[key] || []);
      });

      return clone;
    }

    function Composition(message, options) {
      this.email = prepareEmail(message);
      this.draft = options && options.fromDraft || draftService.startDraft(this.email);
    }

    Composition.prototype._cancelDelayedDraftSave = function() {
      if (this.delayedDraftSave) {
        $timeout.cancel(this.delayedDraftSave);
      }
    };

    function _areDraftsEnabled() {
      return inboxConfig('drafts')
        .then(function(drafts) {
          return drafts ? $q.when() : $q.reject();
        });
    }

    Composition.prototype.saveDraft = function(options) {
      var self = this;

      return _areDraftsEnabled().then(function() {
        self._cancelDelayedDraftSave();

        return self.draft.save(self.email, options)
          .then(function(newEmailstate) {
            self.draft.destroy();

            return newEmailstate;
          })
          .then(function(newEmailstate) {
            self.draft = draftService.startDraft(prepareEmail(newEmailstate));

            return newEmailstate;
          });
      });
    };

    Composition.prototype.saveDraftSilently = function() {
      this._cancelDelayedDraftSave();
      this.delayedDraftSave = $timeout(angular.noop, DRAFT_SAVING_DEBOUNCE_DELAY);

      return this.delayedDraftSave.then(this.saveDraft.bind(this, { silent: true, partial: true }));
    };

    Composition.prototype.getEmail = function() {
      return this.email;
    };

    Composition.prototype.isEmailEmpty = function() {
      var mail = this.getEmail();

      return ['subject', 'to', 'cc', 'bcc', 'attachments', emailBodyService.bodyProperty].every(function(arg) {
          return _.isEmpty(mail[arg]);
        }
      );
    };

    Composition.prototype.canBeSentOrNotify = function() {
      if (emailSendingService.noRecipient(this.email)) {
        notificationFactory.weakError('Note', 'Your email should have at least one recipient');

        return false;
      }

      if (!Offline.state || Offline.state === 'down') {
        notificationFactory.weakError('Note', 'Your device loses its Internet connection. Try later!');

        return false;
      }

      return true;
    };

    function quoteOriginalEmailIfNeeded(email) {
      // This will only be true if we're on a mobile device and the user did not press "Edit quoted email".
      // We need to quote the original email in this case, and set the quote as the HTML body so that
      // the sent email contains the original email, quoted as-is
      if (!email.isQuoting && email.quoted) {
        return emailBodyService.quoteOriginalEmail(email).then(function(body) {
          email.textBody = '';
          email.htmlBody = body;

          return email;
        });
      }

      return $q.when(email);
    }

    function _buildSendNotificationOptions(email) {
      return {
        onFailure: {
          linkText: 'Reopen the composer',
          action: _makeReopenComposerFn(email)
        }
      };
    }

    function _makeReopenComposerFn(email) {
      return newComposerService.open.bind(newComposerService, email);
    }

    Composition.prototype.send = function() {
      this._cancelDelayedDraftSave();

      emailSendingService.removeDuplicateRecipients(this.email);

      return backgroundAction({
        progressing: 'Your message is being sent...',
        success: 'Message sent',
        failure: function() {
          if (!Offline.state || Offline.state === 'down') {
            return 'You have been disconnected. Please check if the message was sent before retrying';
          }

          return 'Your message cannot be sent';
        }
      }, function() {
        return waitUntilMessageIsComplete(this.email)
          .then(quoteOriginalEmailIfNeeded.bind(null, this.email))
          .then(function(email) {
            return emailSendingService.sendEmail(email);
          });
      }.bind(this), _buildSendNotificationOptions(this.email))
        .then(this.draft.destroy.bind(this.draft));
    };

    Composition.prototype.destroyDraft = function() {
      var self = this;

      return _areDraftsEnabled().then(function() {
        self._cancelDelayedDraftSave();

        if (!self.isEmailEmpty()) {
          return gracePeriodService.askUserForCancel('This draft has been discarded', 'Reopen').promise
            .then(function(result) {
              if (result.cancelled) {
                _makeReopenComposerFn(self.email)({ fromDraft: self.draft });
              } else {
                self.draft.destroy();
              }
            });
        }

        return self.draft.destroy();
      });
    };

    return Composition;
  })

  .factory('waitUntilMessageIsComplete', function($q, _) {
    function attachmentsAreReady(message) {
      return _.size(message.attachments) === 0 || _.every(message.attachments, 'blobId');
    }

    return function(message) {
      if (attachmentsAreReady(message)) {
        return $q.when(message);
      }

      return $q.all(message.attachments.map(function(attachment) {
        return attachment.upload.promise;
      })).then(_.constant(message));
    };
  })

  .factory('localTimezone', function() {
    // Explicit '' here to tell angular to use the browser timezone for
    // Date formatting in the 'date' filter. This factory is here to be mocked in unit tests
    // so that the formatting is consistent accross various development machines.
    //
    // See: https://docs.angularjs.org/api/ng/filter/date
    return '';
  })

  .factory('emailBodyService', function($interpolate, $templateRequest, deviceDetector, localTimezone) {

    function quote(email, templateName, forceRichTextTemplate) {
      if (!templateName) {
        templateName = 'default';
      }

      return _quote(email, '/unifiedinbox/views/partials/quotes/' + templateName + (forceRichTextTemplate || supportsRichtext() ? '.html' : '.txt'));
    }

    function quoteOriginalEmail(email) {
      return _quote(email, '/unifiedinbox/views/partials/quotes/original.html');
    }

    function _quote(email, template) {
      return $templateRequest(template).then(function(template) {
        return $interpolate(template)({ email: email, dateFormat: 'medium', tz: localTimezone });
      });
    }

    function supportsRichtext() {
      return !deviceDetector.isMobile();
    }

    return {
      bodyProperty: supportsRichtext() ? 'htmlBody' : 'textBody',
      quote: quote,
      quoteOriginalEmail: quoteOriginalEmail,
      supportsRichtext: supportsRichtext
    };
  })

  .factory('inboxMailboxesCache', function() {
    return [];
  })

  .service('searchService', function(_, attendeeService, INBOX_AUTOCOMPLETE_LIMIT) {
    function searchRecipients(query) {
      return attendeeService.getAttendeeCandidates(query, INBOX_AUTOCOMPLETE_LIMIT).then(function(recipients) {
        return recipients
          .filter(_.property('email'))
          .map(function(recipient) {
            recipient.name = recipient.name || recipient.displayName || recipient.email;

            return recipient;
          });
      }, _.constant([]));
    }

    function searchByEmail(email) {
      return attendeeService.getAttendeeCandidates(email, 1).then(function(results) {
        return results.length > 0 ? results[0] : null;
      }, _.constant(null));
    }

    return {
      searchByEmail: _.memoize(searchByEmail),
      searchRecipients: searchRecipients
    };
  })

  .service('inboxJmapItemService', function($q, $rootScope, session, newComposerService, emailSendingService, backgroundAction,
                                            jmap, inboxMailboxesService, infiniteListService, inboxSelectionService,
                                            asyncJmapAction, _, INBOX_EVENTS) {
    function _rejectIfNotFullyUpdated(response) {
      if (!_.isEmpty(response.notUpdated)) {
        return $q.reject(response);
      }
    }

    function moveToTrash(itemOrItems) {
      return inboxMailboxesService.getMailboxWithRole(jmap.MailboxRole.TRASH).then(function(mailbox) {
        return moveMultipleItems(itemOrItems, mailbox);
      });
    }

    function _updateItemMailboxIds(item, newMailboxIds) {
      item.oldMailboxIds = item.mailboxIds;
      item.mailboxIds = newMailboxIds;

      return item;
    }

    function moveToMailbox(itemOrItems, mailbox) {
      var toMailboxIds = [mailbox.id],
          items = angular.isArray(itemOrItems) ? itemOrItems : [itemOrItems],
          itemsById = _.indexBy(items, function(item) {
            if (item.isUnread) {
              inboxMailboxesService.moveUnreadMessages(item.mailboxIds, toMailboxIds, 1);
            }

            $rootScope.$broadcast(INBOX_EVENTS.ITEM_MAILBOX_IDS_CHANGED, _updateItemMailboxIds(item, toMailboxIds));

            return item.id;
          });

      return asyncJmapAction({
        failure: items.length > 1 ? 'Some items could not be moved to "' + mailbox.displayName + '"' : 'Cannot move "' + items[0].subject + '" to "' + mailbox.displayName + '"'
      }, function(client) {
        return client.setMessages({
          update: _.mapValues(itemsById, _.constant({ mailboxIds: toMailboxIds }))
        })
          .then(_rejectIfNotFullyUpdated)
          .catch(function(response) {
            _.forEach(response.notUpdated, function(error, id) {
              var item = itemsById[id];

              $rootScope.$broadcast(INBOX_EVENTS.ITEM_MAILBOX_IDS_CHANGED, _updateItemMailboxIds(item, item.oldMailboxIds));

              if (item.isUnread) {
                inboxMailboxesService.moveUnreadMessages(toMailboxIds, item.mailboxIds, 1);
              }
            });

            return $q.reject(response);
          });
      }, { silent: true });
    }

    function moveMultipleItems(itemOrItems, mailbox) {
      var items = angular.isArray(itemOrItems) ? itemOrItems : [itemOrItems];

      inboxSelectionService.unselectAllItems();

      return infiniteListService.actionRemovingElements(function() {
        return moveToMailbox(items, mailbox);
      }, items, function(response) {
        return items.filter(function(item) {
          return response.notUpdated[item.id];
        });
      });
    }

    function reply(message) {
      emailSendingService.createReplyEmailObject(message.id, session.user).then(function(replyMessage) {
        newComposerService.open(replyMessage);
      });
    }

    function replyAll(message) {
      emailSendingService.createReplyAllEmailObject(message.id, session.user).then(function(replyMessage) {
        newComposerService.open(replyMessage);
      });
    }

    function forward(message) {
      emailSendingService.createForwardEmailObject(message.id, session.user).then(function(forwardMessage) {
        newComposerService.open(forwardMessage);
      });
    }

    function markAsUnread(itemOrItems) {
      return this.setFlag(itemOrItems, 'isUnread', true);
    }

    function markAsRead(itemOrItems) {
      return this.setFlag(itemOrItems, 'isUnread', false);
    }

    function markAsFlagged(itemOrItems) {
      return this.setFlag(itemOrItems, 'isFlagged', true);
    }

    function unmarkAsFlagged(itemOrItems) {
      return this.setFlag(itemOrItems, 'isFlagged', false);
    }

    function setFlag(itemOrItems, flag, state) {
      var items = _.isArray(itemOrItems) ? itemOrItems : [itemOrItems],
          itemsById = _.indexBy(items, function(item) {
            item[flag] = state;
            $rootScope.$broadcast(INBOX_EVENTS.ITEM_FLAG_CHANGED, item, flag, state);

            return item.id;
          });

      return asyncJmapAction({
        failure: items.length > 1 ? 'Some items could not be updated' : 'Could not update "' + items[0].subject + '"'
      }, function(client) {
        return client.setMessages({
          update: _.mapValues(itemsById, _.constant(_.zipObject([flag], [state])))
        })
          .then(_rejectIfNotFullyUpdated)
          .catch(function(response) {
            _.forEach(response.notUpdated, function(error, id) {
              var item = itemsById[id];

              item[flag] = !state;
              $rootScope.$broadcast(INBOX_EVENTS.ITEM_FLAG_CHANGED, item, flag, state);
            });

            return $q.reject(response);
          });
      }, { silent: true });
    }

    return {
      reply: reply,
      replyAll: replyAll,
      forward: forward,
      markAsUnread: markAsUnread,
      markAsRead: markAsRead,
      markAsFlagged: markAsFlagged,
      unmarkAsFlagged: unmarkAsFlagged,
      moveToTrash: moveToTrash,
      moveToMailbox: moveToMailbox,
      moveMultipleItems: moveMultipleItems,
      setFlag: setFlag
    };
  })

  .service('attachmentUploadService', function($q, $rootScope, inboxConfig, jmapClientProvider, inBackground, xhrWithUploadProgress) {
    function in$Apply(fn) {
      return function(value) {
        if ($rootScope.$$phase) {
          return fn(value);
        }

        return $rootScope.$apply(function() {
          fn(value);
        });
      };
    }

    //eslint-disable-next-line no-unused-vars
    function uploadFile(unusedUrl, file, type, size, options, canceler) {
      return $q.all([
        jmapClientProvider.get(),
        inboxConfig('uploadUrl')
      ]).then(function(data) {
        var authToken = data[0].authToken,
            url = data[1],
            defer = $q.defer(),
            request = $.ajax({
              type: 'POST',
              headers: {
                Authorization: authToken
              },
              url: url,
              contentType: type,
              data: file,
              processData: false,
              dataType: 'json',
              success: in$Apply(defer.resolve),
              error: function(xhr, status, error) {
                in$Apply(defer.reject)({
                  xhr: xhr,
                  status: status,
                  error: error
                });
              },
              xhr: xhrWithUploadProgress(in$Apply(defer.notify))
            });

        if (canceler) {
          canceler.then(request.abort);
        }

        return inBackground(defer.promise);
      });
    }

    return {
      uploadFile: uploadFile
    };
  })

  .factory('inboxSwipeHelper', function($timeout, $q, inboxConfig, INBOX_SWIPE_DURATION) {
    function _autoCloseSwipeHandler(scope) {
      $timeout(scope.swipeClose, INBOX_SWIPE_DURATION, false);

      return $q.when();
    }

    function createSwipeRightHandler(scope, handlers) {
      return function() {
        return _autoCloseSwipeHandler(scope)
          .then(inboxConfig.bind(null, 'swipeRightAction', 'markAsRead'))
          .then(function(action) {
            return handlers[action]();
          });
      };
    }

    return {
      createSwipeRightHandler: createSwipeRightHandler
    };
  })

  .factory('inboxSpecialMailboxes', function(jmap, _) {
    var mailboxes = [{
      id: 'all',
      name: 'All Mail',
      role: { value: 'all' },
      filter: {
        unprocessed: true,
        notInMailboxes: [
          jmap.MailboxRole.ARCHIVE,
          jmap.MailboxRole.DRAFTS,
          jmap.MailboxRole.OUTBOX,
          jmap.MailboxRole.SENT,
          jmap.MailboxRole.TRASH,
          jmap.MailboxRole.SPAM
        ]
      }
    }];

    mailboxes.forEach(function(mailbox) {
      mailbox.role = mailbox.role || {};
      mailbox.qualifiedName = mailbox.name;
      mailbox.unreadMessages = 0;
    });

    function list() {
      return mailboxes;
    }

    function get(mailboxId) {
      return _.find(mailboxes, { id: mailboxId });
    }

    return {
      list: list,
      get: get
    };
  })

  .factory('inboxFilters', function(PROVIDER_TYPES) {
    return [
      {
        id: 'isUnread',
        displayName: 'Unread',
        type: PROVIDER_TYPES.JMAP
      },
      {
        id: 'isFlagged',
        displayName: 'Starred',
        type: PROVIDER_TYPES.JMAP
      },
      {
        id: 'hasAttachment',
        displayName: 'With attachments',
        type: PROVIDER_TYPES.JMAP
      },
      {
        id: 'isSocial',
        displayName: 'Social',
        type: PROVIDER_TYPES.SOCIAL
      },
      {
        id: 'inboxTwitterMentions',
        displayName: 'Mentions',
        type: PROVIDER_TYPES.TWITTER
      },
      {
        id: 'inboxTwitterDirectMessages',
        displayName: 'Direct Messages',
        type: PROVIDER_TYPES.TWITTER
      }
    ];
  })

  .factory('inboxFilteringService', function(inboxFilters, _, PROVIDER_TYPES) {
    var latestMailbox;

    function uncheckFilters() {
      inboxFilters.forEach(function(filter) {
        filter.checked = false;
      });
    }

    function getFiltersByType(types) {
      if (!types) {
        return inboxFilters;
      }

      return _.filter(inboxFilters, function(filter) {
        return _.contains(types, filter.type);
      });
    }

    function maybeResetAndGetFilters(types, mailbox) {
      if (latestMailbox !== mailbox) {
        latestMailbox = mailbox;

        uncheckFilters();
      }

      return getFiltersByType(types);
    }

    function getJmapFilter() {
      return getFiltersByType(PROVIDER_TYPES.JMAP).reduce(function(result, filter) {
        if (filter.checked) {
          result[filter.id] = true;
        }

        return result;
      }, {});
    }

    function isAnyFilterOfTypeSelected(type) {
      return _.some(inboxFilters, { type: type, checked: true });
    }

    function isAnyFilterSelected() {
      return _.some(inboxFilters, { checked: true });
    }

    function getAcceptedTypesFilter() {
      var jmap = isAnyFilterOfTypeSelected(PROVIDER_TYPES.JMAP),
          social = isAnyFilterOfTypeSelected(PROVIDER_TYPES.SOCIAL);

      if (social && jmap) {
        return [];
      } else if (jmap) {
        return [PROVIDER_TYPES.JMAP];
      } else if (social) {
        return [PROVIDER_TYPES.SOCIAL];
      }

      return [PROVIDER_TYPES.JMAP, PROVIDER_TYPES.SOCIAL];
    }

    function getSelectedTwitterProviderIds(accountId) {
      function getTargetProviderId(provider) {
        return provider.id + accountId;
      }

      var filters = getFiltersByType(PROVIDER_TYPES.TWITTER),
          selectedProviders = _(filters).filter({ checked: true }).map(getTargetProviderId).value();

      return selectedProviders.length > 0 ? selectedProviders : _.map(filters, getTargetProviderId);
    }

    return {
      getFiltersForJmapMailbox: maybeResetAndGetFilters.bind(null, [PROVIDER_TYPES.JMAP]),
      getFiltersForUnifiedInbox: maybeResetAndGetFilters.bind(null, [PROVIDER_TYPES.JMAP, PROVIDER_TYPES.SOCIAL], 'unifiedinbox'),
      getFiltersForTwitterAccount: maybeResetAndGetFilters.bind(null, [PROVIDER_TYPES.TWITTER]),
      getJmapFilter: getJmapFilter,
      isAnyFilterOfTypeSelected: isAnyFilterOfTypeSelected,
      isAnyFilterSelected: isAnyFilterSelected,
      getAcceptedTypesFilter: getAcceptedTypesFilter,
      uncheckFilters: uncheckFilters,
      getSelectedTwitterProviderIds: getSelectedTwitterProviderIds
    };
  })

  .factory('inboxFilteringAwareInfiniteScroll', function($q, infiniteScrollOnGroupsHelper, ByDateElementGroupingTool, INBOX_EVENTS) {
    return function(scope, getAvailableFilters, buildFetcher) {
      function setFilter() {
        return $q.when(buildFetcher())
          .then(function(fetcher) {
            scope.loadMoreElements = infiniteScrollOnGroupsHelper(
              scope,
              fetcher,
              new ByDateElementGroupingTool()
            );

            scope.loadRecentItems = fetcher.loadRecentItems;
          })
          .then(function() {
            return scope.loadMoreElements();
          });
      }

      scope.filters = getAvailableFilters();

      scope.$on(INBOX_EVENTS.FILTER_CHANGED, function() {
        scope.infiniteScrollDisabled = false;
        scope.infiniteScrollCompleted = false;

        scope.loadMoreElements.destroy();

        setFilter();
      });

      return setFilter();
    };
  })

  .factory('inboxSelectionService', function(_) {
    var selectedItems = [],
        selecting = false;

    function toggleItemSelection(item, shouldSelect) {
      var selected = angular.isDefined(shouldSelect) ? shouldSelect : !item.selected;

      if (item.selected === selected) {
        return;
      }

      item.selected = selected;

      if (selected) {
        selectedItems.push(item);
      } else {
        _.pull(selectedItems, item);
      }

      selecting = selectedItems.length > 0;
    }

    function unselectAllItems() {
      selectedItems.forEach(function(item) {
        item.selected = false;
      });

      selectedItems.length = 0;
      selecting = false;
    }

    return {
      isSelecting: function() { return selecting; },
      getSelectedItems: function() { return _.clone(selectedItems); },
      toggleItemSelection: toggleItemSelection,
      unselectAllItems: unselectAllItems
    };
  })

  .factory('inboxAsyncHostedMailControllerHelper', function($q, session, inboxMailboxesService, INBOX_CONTROLLER_LOADING_STATES) {
    return function(controller, action) {
      controller.account = {
        name: session.user.preferredEmail
      };

      controller.load = function() {
        controller.state = INBOX_CONTROLLER_LOADING_STATES.LOADING;

        return action().then(function(value) {
          controller.state = INBOX_CONTROLLER_LOADING_STATES.LOADED;

          return value;
        }, function(err) {
          controller.state = INBOX_CONTROLLER_LOADING_STATES.ERROR;

          return $q.reject(err);
        });
      };

      return controller.load(); // Try load when controller is first initialized
    };
  });
