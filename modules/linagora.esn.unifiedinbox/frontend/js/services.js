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
        inboxConfig('api'),
        inboxConfig('downloadUrl')
      ]).then(function(data) {
        return new jmap.Client(dollarHttpTransport, dollarQPromiseProvider)
          .withAPIUrl(data[1])
          .withDownloadUrl(data[2])
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

  .factory('jmapHelper', function($q, jmap, session, emailBodyService, userUtils, withJmapClient, backgroundAction, _,
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

    function setFlag(item, flag, state) {
      if (!item || !flag || !angular.isDefined(state)) {
        throw new Error('Parameters "item", "flag" and "state" are required.');
      }

      if (item[flag] === state) {
        return $q.when(item);
      }

      item[flag] = state; // Be optimist!

      return backgroundAction('Modification of "' + item.subject + '"', function() {
        return item['set' + jmap.Utils.capitalize(flag)](state)
          .then(_.constant(item), function(err) {
            item[flag] = !state;

            return $q.reject(err);
          });
      }, { silent: true });
    }

    function getMessageById(id) {
      return withJmapClient(function(client) {
        return client
          .getMessages({ ids: [id], properties: JMAP_GET_MESSAGES_VIEW })
          .then(_.head);
      });
    }

    return {
      setFlag: setFlag,
      getMessageById: getMessageById,
      toOutboundMessage: toOutboundMessage
    };
  })

  .factory('emailSendingService', function($q, emailService, jmap, _, emailBodyService, sendEmail, jmapHelper) {

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

    function showReplyAllButton(email) {
      return countRecipients(email) > 1;
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

        if (!emailBodyService.supportsRichtext()) {
          return $q.when(newEmail);
        }

        return emailBodyService.quote(message, templateName).then(function(body) {
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
                                   DRAFT_SAVING_DEBOUNCE_DELAY, notifyOfGracedRequest, _, inboxConfig) {

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

      return backgroundAction('Sending of your message', function() {
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
          return notifyOfGracedRequest('This draft has been discarded', 'Reopen').promise
            .then(function(result) {
              if (result.cancelled) {
                _makeReopenComposerFn(self.email)({ fromDraft: self.draft });
              } else {
                self.draft.destroy();
              }
            });
        } else {
          return self.draft.destroy();
        }
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

  .factory('inboxMailboxesCache', function() {
    return [];
  })

  .factory('mailboxesService', function($q, _, withJmapClient, MAILBOX_LEVEL_SEPARATOR, jmap, inboxSpecialMailboxes,
                                        inboxMailboxesCache, asyncJmapAction, Mailbox) {

    var RESTRICT_MAILBOXES = [
      jmap.MailboxRole.OUTBOX.value,
      jmap.MailboxRole.DRAFTS.value
    ];

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
      mailboxIds.forEach(function(mailboxId) {
        var mailbox = _.find(inboxMailboxesCache, { id: mailboxId });

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
        return RESTRICT_MAILBOXES.indexOf(mailbox.role.value) > -1;
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

    function createMailbox(mailbox) {
      return asyncJmapAction('Creation of folder ' + mailbox.displayName, function(client) {
        return client.createMailbox(mailbox.name, mailbox.parentId);
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

  .service('inboxJmapItemService', function($q, session, newComposerService, emailSendingService, backgroundAction, jmap, jmapHelper, mailboxesService) {
    function moveToTrash(item, options) {
      return backgroundAction('Move of "' + item.subject + '" to trash', function() {
        return item.moveToMailboxWithRole(jmap.MailboxRole.TRASH);
      }, options);
    }

    function moveToMailbox(item, mailbox) {
      var fromMailboxIds = item.mailboxIds.slice(0),
          toMailboxIds = [mailbox.id];

      if (item.isUnread) {
        mailboxesService.moveUnreadMessages(fromMailboxIds, toMailboxIds, 1);
      }

      return backgroundAction(
        'Move of "' + item.subject + '" to ' + mailbox.displayName,
        function() {
          return item.move(toMailboxIds);
        }, { silent: true }
      ).catch(function(err) {
        if (item.isUnread) {
          mailboxesService.moveUnreadMessages(toMailboxIds, fromMailboxIds, 1);
        }

        return $q.reject(err);
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

    function markAsUnread(email) {
      return jmapHelper.setFlag(email, 'isUnread', true);
    }

    function markAsRead(email) {
      return jmapHelper.setFlag(email, 'isUnread', false);
    }

    function markAsFlagged(email) {
      return jmapHelper.setFlag(email, 'isFlagged', true);
    }

    function unmarkAsFlagged(email) {
      return jmapHelper.setFlag(email, 'isFlagged', false);
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

    function getFiltersByType(type) {
      if (!type) {
        return inboxFilters;
      }

      return _.filter(inboxFilters, { type: type });
    }

    function maybeResetAndGetFilters(type, mailbox) {
      if (latestMailbox !== mailbox) {
        latestMailbox = mailbox;

        uncheckFilters();
      }

      return getFiltersByType(type);
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
      } else {
        return [PROVIDER_TYPES.JMAP, PROVIDER_TYPES.SOCIAL];
      }
    }

    return {
      getFiltersForJmapMailbox: maybeResetAndGetFilters.bind(null, PROVIDER_TYPES.JMAP),
      getFiltersForUnifiedInbox: maybeResetAndGetFilters.bind(null, null, 'unifiedinbox'),
      getJmapFilter: getJmapFilter,
      isAnyFilterOfTypeSelected: isAnyFilterOfTypeSelected,
      isAnyFilterSelected: isAnyFilterSelected,
      getAcceptedTypesFilter: getAcceptedTypesFilter,
      uncheckFilters: uncheckFilters
    };
  })

  .factory('inboxFilteringAwareInfiniteScroll', function(infiniteScrollOnGroupsHelper, ByDateElementGroupingTool, INBOX_EVENTS) {
    return function(scope, getAvailableFilters, buildLoadNextItemsFunction) {
      function setFilter() {
        scope.loadMoreElements = infiniteScrollOnGroupsHelper(
          scope,
          buildLoadNextItemsFunction(),
          new ByDateElementGroupingTool()
        );
      }

      scope.filters = getAvailableFilters();

      scope.$on(INBOX_EVENTS.FILTER_CHANGED, function() {
        scope.infiniteScrollDisabled = false;
        scope.infiniteScrollCompleted = false;

        setFilter();
        scope.loadMoreElements();
      });

      setFilter();
    };
  });
