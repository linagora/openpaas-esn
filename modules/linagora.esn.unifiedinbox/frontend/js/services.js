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
    var promise;

    function _initializeJmapClient() {
      return $q.all([
        generateJwtToken(),
        inboxConfig('api')
      ]).then(function(data) {
        return new jmap.Client(dollarHttpTransport, dollarQPromiseProvider)
          .withAPIUrl(data[1])
          .withAuthenticationToken('Bearer ' + data[0]);
      });
    }

    function get() {
      if (!promise) {
        promise = _initializeJmapClient();
      }

      return promise;
    }

    return {
      get: get
    };
  })

  .factory('withJmapClient', function(jmapClientProvider) {
    return function(callback) {
      return jmapClientProvider.get().then(function(client) {
        return callback(client);
      }, callback.bind(null, null));
    };
  })

  .factory('asyncAction', function($q, $log, notificationFactory) {

    function notifyFailure(cancelActionConfig, errorMessage) {
      var notification = notificationFactory.weakError('Error', errorMessage);

      cancelActionConfig && notification.setCancelAction(cancelActionConfig);
    }

    return function(message, action, options) {

      var isSilent = (options && options.silent),
          notification = isSilent ? undefined : notificationFactory.strongInfo('', message + ' in progress...');

      return action()
        .then(function(value) {
          !isSilent && notificationFactory.weakSuccess('', message + ' succeeded');

          return value;
        }, function(err) {
          $log.error(err);
          notifyFailure(options && options.onFailure, message + ' failed');

          return $q.reject(err);
        })
        .finally(function() {
          notification && notification.close();
        });
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

  .factory('rejectWithErrorNotification', function($q, notificationFactory) {
    return function(message) {
      notificationFactory.weakError('Error', message);

      return $q.reject(new Error(message));
    };
  })

  .factory('sendEmail', function($http, $q, inboxConfig, inBackground, jmap, withJmapClient, jmapHelper) {
    function sendBySmtp(email) {
      return $http.post('/unifiedinbox/api/inbox/sendemail', email);
    }

    function sendByJmap(client, message) {
      return $q.all([
          client.saveAsDraft(message),
          client.getMailboxWithRole(jmap.MailboxRole.OUTBOX)
        ]).then(function(data) {
          return client.moveMessage(data[0].id, [data[1].id]);
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
            return sendByJmap(client, message);
          } else {
            return client.send(message);
          }
        });
      });
    }

    return function(email) {
      return inBackground(sendEmail(email));
    };
  })

  .factory('jmapHelper', function(jmap, session, emailBodyService) {
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
          name: session.user.name
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

    return {
      toOutboundMessage: toOutboundMessage
    };
  })

  .factory('emailSendingService', function($q, $http, emailService, deviceDetector, jmap, _, emailBodyService, sendEmail) {

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

    function _countRecipients(email) {
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
      return _countRecipients(email) === 0;
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

    function showReplyAllButton(email) {
      return _countRecipients(email) > 1;
    }

    function getEmailAddress(recipient) {
      if (recipient) {
        return recipient.email || recipient.preferredEmail;
      }
    }

    function getReplyToField(email) {
      if (email.replyTo && jmap.EMailer.unknown().email !== email.replyTo.email) {
        return email.replyTo;
      }

      return email.from;
    }

    function getReplyAllRecipients(email, sender) {
      function notMe(item) {
        return item.email !== getEmailAddress(sender);
      }

      if (!email || !sender) {
        return;
      }

      return {
        to: _(email.to || []).concat(getReplyToField(email)).uniq('email').value().filter(notMe),
        cc: (email.cc || []).filter(notMe),
        bcc: email.bcc || []
      };
    }

    function getReplyRecipients(email) {
      if (!email) {
        return;
      }

      return {
        to: [getReplyToField(email)],
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

    function _createQuotedEmail(subjectPrefix, recipients, templateName, includeAttachments, email, sender) {
      var newRecipients = recipients ? recipients(email, sender) : {},
          newEmail = {
            from: getEmailAddress(sender),
            to: newRecipients.to || [],
            cc: newRecipients.cc || [],
            bcc: newRecipients.bcc || [],
            subject: prefixSubject(email.subject, subjectPrefix),
            quoted: email,
            isQuoting: false,
            quoteTemplate: templateName
          };

      includeAttachments && (newEmail.attachments = email.attachments);

      if (!emailBodyService.supportsRichtext()) {
        return $q.when(newEmail);
      }

      return emailBodyService.quote(email, templateName).then(function(body) {
        return _enrichWithQuote(newEmail, body);
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
      showReplyAllButton: showReplyAllButton,
      createReplyAllEmailObject: _createQuotedEmail.bind(null, 'Re: ', getReplyAllRecipients, 'default', false),
      createReplyEmailObject: _createQuotedEmail.bind(null, 'Re: ', getReplyRecipients, 'default', false),
      createForwardEmailObject: _createQuotedEmail.bind(null, 'Fw: ', null, 'forward', true)
    };
  })

  .service('draftService', function($q, $log, jmap, session, notificationFactory, asyncJmapAction, emailBodyService, _,
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

  .service('newComposerService', function($state, withJmapClient, boxOverlayOpener, deviceDetector, notificationFactory, JMAP_GET_MESSAGES_VIEW) {
    var defaultTitle = 'Compose an email';

    function choseByPlatform(mobile, others) {
      deviceDetector.isMobile() ? mobile() : others();
    }

    function newMobileComposer(email) {
      $state.go('unifiedinbox.compose', {
        email: email,
        previousState: {
          name: $state.current.name,
          params: $state.params
        }});
    }

    function newBoxedComposerCustomTitle(title, email) {
      boxOverlayOpener.open({
        id: email && email.id,
        title: title,
        templateUrl: '/unifiedinbox/views/composer/box-compose.html',
        email: email
      });
    }

    function newBoxedDraftComposer(email) {
      newBoxedComposerCustomTitle('Continue your draft', email);
    }

    function open(email, title) {
      choseByPlatform(
        newMobileComposer.bind(null, email),
        newBoxedComposerCustomTitle.bind(null, title || defaultTitle, email)
      );
    }

    function openDraft(emailId) {
      withJmapClient(function(client) {
        client
          .getMessages({ ids: [emailId], properties: JMAP_GET_MESSAGES_VIEW })
          .then(function(messages) {
            var email = messages[0];

            choseByPlatform(
              newMobileComposer.bind(this, email),
              newBoxedDraftComposer.bind(this, email)
            );
          });
      });
    }

    return {
      open: open,
      openDraft: openDraft
    };
  })

  .factory('Composition', function($q, $timeout, draftService, emailSendingService, notificationFactory, Offline,
                                   backgroundAction, jmap, emailBodyService, waitUntilMessageIsComplete, newComposerService,
                                   DRAFT_SAVING_DEBOUNCE_DELAY) {

    function prepareEmail(email) {
      var preparingEmail = angular.copy(email || {});

      ['to', 'cc', 'bcc'].forEach(function(recipients) {
        preparingEmail[recipients] = preparingEmail[recipients] || [];
      });

      return preparingEmail;
    }

    function Composition(message) {
      this.email = prepareEmail(message);
      this.draft = draftService.startDraft(this.email);
    }

    Composition.prototype._cancelDelayedDraftSave = function() {
      if (this.delayedDraftSave) {
        $timeout.cancel(this.delayedDraftSave);
      }
    };

    Composition.prototype.saveDraft = function(options) {
      this._cancelDelayedDraftSave();

      return this.draft.save(this.email, options)
        .then(function(newEmailstate) {
          this.draft.destroy();

          return newEmailstate;
        }.bind(this))
        .then(function(newEmailstate) {
          this.draft = draftService.startDraft(prepareEmail(newEmailstate));

          return newEmailstate;
        }.bind(this));
    };

    Composition.prototype.saveDraftSilently = function() {
      this._cancelDelayedDraftSave();
      this.delayedDraftSave = $timeout(angular.noop, DRAFT_SAVING_DEBOUNCE_DELAY);

      return this.delayedDraftSave.then(this.saveDraft.bind(this, { silent: true, partial: true }));
    };

    Composition.prototype.getEmail = function() {
      return this.email;
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

    function buildSendNotificationOptions(messageContent) {
      return {
        onFailure: {
          linkText: 'Reopen the composer',
          action: function() {
            newComposerService.open(messageContent, 'Resume message composition');
          }
        }
      };
    }

    Composition.prototype.send = function() {
      this._cancelDelayedDraftSave();

      emailSendingService.removeDuplicateRecipients(this.email);

      return backgroundAction('Sending of your message', function() {
        return waitUntilMessageIsComplete(this.email)
          .then(quoteOriginalEmailIfNeeded.bind(null, this.email))
          .then(function(email) {
            return emailSendingService.sendEmail(email);
          });
      }.bind(this), buildSendNotificationOptions(this.email))
        .then(this.draft.destroy.bind(this.draft));
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

    function quote(email, templateName) {
      if (!templateName) {
        templateName = 'default';
      }

      return _quote(email, '/unifiedinbox/views/partials/quotes/' + templateName + (supportsRichtext() ? '.html' : '.txt'));
    }

    function quoteOriginalEmail(email) {
      return _quote(email, '/unifiedinbox/views/partials/quotes/original-' + email.quoteTemplate + '.html');
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

  .factory('mailboxesService', function(_, withJmapClient, MAILBOX_LEVEL_SEPARATOR) {
    var mailboxesCache;

    function filterSystemMailboxes(mailboxes) {
      return _.reject(mailboxes, function(mailbox) { return mailbox.role.value; });
    }

    function qualifyMailboxes(mailboxes) {
      return mailboxes.map(qualifyMailbox.bind(null, mailboxes));
    }

    function qualifyMailbox(mailboxes, mailbox) {
      function findParent(box) {
        return box.parentId && _.find(mailboxes, { id: box.parentId });
      }

      var parent = mailbox;

      mailbox.level = 1;
      mailbox.qualifiedName = mailbox.name;

      while ((parent = findParent(parent))) {
        mailbox.qualifiedName = parent.name + MAILBOX_LEVEL_SEPARATOR + mailbox.qualifiedName;
        mailbox.level++;
      }

      return mailbox;
    }

    function _modifyUnreadMessages(id, number) {
      var mailbox = _.find(mailboxesCache, { id: id });

      if (mailbox && angular.isDefined(mailbox.unreadMessages)) {
        mailbox.unreadMessages = Math.max(mailbox.unreadMessages + number, 0);
      }
    }

    function _setMailboxesCache(mailboxes) {
      if (mailboxes) {
        mailboxesCache = mailboxes;
      }

      return mailboxes;
    }

    function _updateMailboxCache(mailbox) {
      if (mailbox) {
        var index = _.findIndex(mailboxesCache, { id: mailbox.id });

        if (index > -1) {
          mailboxesCache[index] = mailbox;
        }
      }

      return mailbox;
    }

    function _assignToObject(object) {
      return function(attr, value) {
        if (object && !object[attr]) {
          object[attr] = value;
        }

        return value;
      };
    }

    function assignMailbox(id, dst) {
      return withJmapClient(function(client) {
        return client.getMailboxes({
          ids: [id]
        })
          .then(function(mailboxes) {
            return mailboxes[0]; // We expect a single mailbox here
          })
          .then(qualifyMailbox.bind(null, mailboxesCache))
          .then(_assignToObject(dst).bind(null, 'mailbox'))
          .then(_updateMailboxCache);
      });
    }

    function assignMailboxesList(dst, filter) {
      return withJmapClient(function(jmapClient) {
        return jmapClient.getMailboxes()
          .then(filter || _.identity)
          .then(qualifyMailboxes)
          .then(_assignToObject(dst).bind(null, 'mailboxes'))
          .then(_setMailboxesCache);
      });
    }

    function flagIsUnreadChanged(email, status) {
      if (email && angular.isDefined(status)) {
        email.mailboxIds.forEach(function(key) {
          _modifyUnreadMessages(key, (status ? 1 : -1));
        });

        return mailboxesCache;
      }
    }

    function updateUnreadMessages(mailboxIds, adjust) {
      mailboxIds.forEach(function(mailboxId) {
        var mailbox = _.find(mailboxesCache, { id: mailboxId });

        if (mailbox) {
          mailbox.unreadMessages = Math.max(mailbox.unreadMessages + adjust, 0);
        }
      });
    }

    function moveUnreadMessages(fromMailboxIds, toMailboxIds, numberOfUnreadMessage) {
      updateUnreadMessages(fromMailboxIds, -numberOfUnreadMessage);
      updateUnreadMessages(toMailboxIds, numberOfUnreadMessage);
    }

    return {
      filterSystemMailboxes: filterSystemMailboxes,
      assignMailboxesList: assignMailboxesList,
      assignMailbox: assignMailbox,
      flagIsUnreadChanged: flagIsUnreadChanged,
      updateUnreadMessages: updateUnreadMessages,
      moveUnreadMessages: moveUnreadMessages
    };
  })

  .service('searchService', function(_, attendeeService, INBOX_AUTOCOMPLETE_LIMIT) {
    return {
      searchRecipients: function(query) {
        return attendeeService.getAttendeeCandidates(query, INBOX_AUTOCOMPLETE_LIMIT).then(function(recipients) {
          return recipients
            .filter(_.property('email'))
            .map(function(recipient) {
              recipient.name = recipient.name || recipient.displayName || recipient.email;

              return recipient;
            });
        });
      }
    };
  })

  .service('jmapEmailService', function($q, jmap, _, backgroundAction) {

    function setFlag(element, flag, state) {
      if (!element || !flag || !angular.isDefined(state)) {
        throw new Error('Parameters "element", "flag" and "state" are required.');
      }

      if (element[flag] === state) {
        return $q.when(element);
      }

      element[flag] = state; // Be optimist!

      return backgroundAction('Changing a message flag', function() {
        return element['set' + jmap.Utils.capitalize(flag)](state)
          .then(_.constant(element), function(err) {
            element[flag] = !state;

            return $q.reject(err);
          });
      }, { silent: true });
    }

    return {
      setFlag: setFlag
    };
  })

  .service('inboxEmailService', function($state, $q, session, newComposerService, emailSendingService, backgroundAction, jmap, jmapEmailService, mailboxesService) {
    function moveToTrash(email, options) {
      return backgroundAction('Move of message "' + email.subject + '" to trash', function() {
        return email.moveToMailboxWithRole(jmap.MailboxRole.TRASH);
      }, options);
    }

    function moveToMailbox(message, mailbox) {
      var fromMailboxIds = message.mailboxIds.slice(0);
      var toMailboxIds = [mailbox.id];

      if (message.isUnread) {
        mailboxesService.moveUnreadMessages(fromMailboxIds, toMailboxIds, 1);
      }

      return backgroundAction(
        'Move of message "' + message.subject + '" to ' + mailbox.name,
        function() {
          return message.move(toMailboxIds);
        }, { silent: true }
      ).catch(function(err) {
        if (message.isUnread) {
          mailboxesService.moveUnreadMessages(toMailboxIds, fromMailboxIds, 1);
        }

        return $q.reject(err);
      });
    }

    function reply(email) {
      emailSendingService.createReplyEmailObject(email, session.user).then(function(replyEmail) {
        newComposerService.open(replyEmail, 'Start writing your reply email');
      });
    }

    function replyAll(email) {
      emailSendingService.createReplyAllEmailObject(email, session.user).then(function(replyEmail) {
        newComposerService.open(replyEmail, 'Start writing your reply all email');
      });
    }

    function forward(email) {
      emailSendingService.createForwardEmailObject(email, session.user).then(function(forwardedEmail) {
        newComposerService.open(forwardedEmail, 'Start writing your forward email');
      });
    }

    function markAsUnread(email) {
      return jmapEmailService.setFlag(email, 'isUnread', true);
    }

    function markAsRead(email) {
      return jmapEmailService.setFlag(email, 'isUnread', false);
    }

    function markAsFlagged(email) {
      jmapEmailService.setFlag(email, 'isFlagged', true);
    }

    function unmarkAsFlagged(email) {
      jmapEmailService.setFlag(email, 'isFlagged', false);
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
      moveToMailbox: moveToMailbox
    };
  })

  .service('inboxThreadService', function($state, $q, session, newComposerService, emailSendingService, backgroundAction, jmap, jmapEmailService, mailboxesService) {
    function moveToTrash(thread, options) {
      return backgroundAction('Move of thread "' + thread.subject + '" to trash', function() {
        return thread.moveToMailboxWithRole(jmap.MailboxRole.TRASH);
      }, options);
    }

    function moveToMailbox(thread, mailbox) {
      var subject = thread.subject || (thread.email ? thread.email.subject : '');
      var fromMailboxIds = thread.email.mailboxIds.slice(0);
      var toMailboxIds = [mailbox.id];

      if (thread.isUnread) {
        mailboxesService.moveUnreadMessages(fromMailboxIds, toMailboxIds, 1);
      }

      return backgroundAction(
        'Move of thread "' + subject + '" to ' + mailbox.name,
        function() {
          return thread.move(toMailboxIds);
        }, { silent: true }
      ).catch(function(err) {
        if (thread.isUnread) {
          mailboxesService.moveUnreadMessages(toMailboxIds, fromMailboxIds, 1);
        }

        return $q.reject(err);
      });
    }

    function markAsRead(thread) {
      return jmapEmailService.setFlag(thread, 'isUnread', false);
    }

    function markAsUnread(thread) {
      return jmapEmailService.setFlag(thread, 'isUnread', true);
    }

    function markAsFlagged(thread) {
      jmapEmailService.setFlag(thread, 'isFlagged', true);
    }

    function unmarkAsFlagged(thread) {
      jmapEmailService.setFlag(thread, 'isFlagged', false);
    }

    return {
      markAsUnread: markAsUnread,
      markAsRead: markAsRead,
      markAsFlagged: markAsFlagged,
      unmarkAsFlagged: unmarkAsFlagged,
      moveToTrash: moveToTrash,
      moveToMailbox: moveToMailbox
    };
  })

  .service('attachmentUploadService', function($q, $rootScope, inboxConfig, inBackground, xhrWithUploadProgress) {
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

    function uploadFile(unusedUrl, file, type, size, options, canceler) {
      return inboxConfig('uploadUrl').then(function(url) {
        var defer = $q.defer(),
          request = $.ajax({
            type: 'POST',
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

    function createSwipeLeftHandler(scope, handler) {
      return function() {
        return _autoCloseSwipeHandler(scope).then(handler);
      };
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
      createSwipeRightHandler: createSwipeRightHandler,
      createSwipeLeftHandler: createSwipeLeftHandler
    };
  });
