'use strict';

angular.module('linagora.esn.unifiedinbox')

  .factory('jmapClient', function(jmap, dollarHttpTransport, dollarQPromiseProvider, jmapAPIUrl, jmapAuthToken) {
    return new jmap.Client(dollarHttpTransport, dollarQPromiseProvider)
      .withAPIUrl(jmapAPIUrl)
      .withAuthenticationToken(jmapAuthToken);
  })

  .factory('EmailGroupingTool', function(moment) {

    function EmailGroupingTool(mailbox, emails) {
      this.mailbox = mailbox;

      this.todayEmails = [];
      this.weeklyEmails = [];
      this.monthlyEmails = [];
      this.otherEmails = [];
      this.allEmails = [
        {name: 'Today', dateFormat: 'shortTime', emails: this.todayEmails},
        {name: 'This Week', dateFormat: 'short', emails: this.weeklyEmails},
        {name: 'This Month', dateFormat: 'short', emails: this.monthlyEmails},
        {name: 'Older than a month', dateFormat: 'fullDate', emails: this.otherEmails}
      ];

      if (emails) {
        this.addAll(emails);
      }

      return this;
    }

    EmailGroupingTool.prototype.addAll = function addEmail(emails) {
      emails.forEach(this.addEmail.bind(this));
    };

    EmailGroupingTool.prototype.addEmail = function addEmail(email) {
      var currentMoment = moment().utc();
      var emailMoment = moment(email.date).utc();

      if (this._isToday(currentMoment, emailMoment)) {
        this.todayEmails.push(email);
      } else if (this._isThisWeek(currentMoment, emailMoment)) {
        this.weeklyEmails.push(email);
      } else if (this._isThisMonth(currentMoment, emailMoment)) {
        this.monthlyEmails.push(email);
      } else {
        this.otherEmails.push(email);
      }
    };

    EmailGroupingTool.prototype._isToday = function _isSameDay(currentMoment, targetMoment) {
      return currentMoment.clone().startOf('day').isBefore(targetMoment);
    };

    EmailGroupingTool.prototype._isThisWeek = function _isSameDay(currentMoment, targetMoment) {
      return currentMoment.clone().subtract(7, 'days').startOf('day').isBefore(targetMoment);
    };

    EmailGroupingTool.prototype._isThisMonth = function _isSameDay(currentMoment, targetMoment) {
      return currentMoment.clone().startOf('month').isBefore(targetMoment);
    };

    EmailGroupingTool.prototype.getGroupedEmails = function getGroupedEmails() {
      return this.allEmails;
    };

    EmailGroupingTool.prototype.reset = function reset() {
      return this.allEmails.forEach(function(emailGroup) {
        emailGroup.emails.length = 0;
      });
    };

    return EmailGroupingTool;
  })

  .factory('createHtmlElement', function() {
    return function(tag, attributes) {
      return angular.extend(document.createElement(tag), attributes || {});
    };
  })

  .factory('emailSendingService', function($q, $http, emailService, deviceDetector, jmap, _, emailBodyService) {

    /**
     * Set the recipient.email and recipient.name fields to recipient.displayName if they are undefined.
     *
     * @param {Object} recipient
     */
    function ensureEmailAndNameFields(recipient) {
      if (!recipient.displayName) {
        return recipient;
      }

      if (!recipient.email) {
        recipient.email = recipient.displayName;
      }
      if (!recipient.name) {
        recipient.name = recipient.displayName;
      }

      return recipient;
    }

    /**
     * Add the following logic when sending an email: Check for an invalid email used as a recipient
     *
     * @param {Object} rcpt
     */
    function emailsAreValid(rcpt) {
      if (!rcpt) {
        return false;
      }

      return [].concat(rcpt.to || [], rcpt.cc || [], rcpt.bcc || []).every(function(recipient) {
        return emailService.isValidEmail(recipient.email);
      });
    }

    /**
     * Add the following logic when sending an email:
     *  Add the same recipient multiple times, in multiples fields (TO, CC...): allowed.
     *  This multi recipient must receive the email as a TO > CC > BCC recipient in this order.
     *  If the person is in TO and CC, s/he receives as TO. If s/he is in CC/BCC, receives as CC, etc).
     *
     * @param {Object} rcpt
     */
    function removeDuplicateRecipients(rcpt) {
      var notIn = function(array) {
        return function(item) {
          return !_.find(array, { email: item.email });
        };
      };

      if (!rcpt) {
        return;
      }

      rcpt.to = rcpt.to || [];
      rcpt.cc = (rcpt.cc || []).filter(notIn(rcpt.to));
      rcpt.bcc = (rcpt.bcc || []).filter(notIn(rcpt.to)).filter(notIn(rcpt.cc));
    }

    function _countRecipients(rcpt) {
      if (!rcpt) {
        return 0;
      }

      return _.size(rcpt.to) + _.size(rcpt.cc) + _.size(rcpt.bcc);
    }

    /**
     * Add the following logic to email sending:
     *  Check whether the user is trying to send an email with no recipient at all
     *
     * @param {Object} rcpt
     */
    function noRecipient(rcpt) {
      return _countRecipients(rcpt) === 0;
    }

    /**
     * This method MUST be modified in the future to leverage a send function provided by JMAPClient
     * The code here MUST not be clean so as to be changed in the future
     */
    function sendEmail(email) {
      var defer = $q.defer();
      $http.post('/unifiedinbox/api/inbox/sendemail', email)
        .success(function(data) {
          defer.resolve(data);
        })
        .error(function(reason) {
          defer.reject(reason);
        });
      return defer.promise;
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

    function showReplyAllButton(rcpt) {
      return _countRecipients(rcpt) > 1;
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

      if (!email || !sender) {
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

    function _enrichWithBody(email, body) {
      if (emailBodyService.supportsRichtext()) {
        email.htmlBody = body;
      } else {
        email.textBody = body;
      }

      return email;
    }

    function createQuotedEmail(subjectPrefix, recipients, email, sender) {
      return emailBodyService.quote(email).then(function(body) {
        var rcpt = recipients(email, sender);

        return _enrichWithBody({
          from: getEmailAddress(sender),
          to: rcpt.to || [],
          cc: rcpt.cc || [],
          bcc: rcpt.bcc || [],
          subject: prefixSubject(email.subject, subjectPrefix)
        }, body);
      });
    }

    return {
      ensureEmailAndNameFields: ensureEmailAndNameFields,
      emailsAreValid: emailsAreValid,
      removeDuplicateRecipients: removeDuplicateRecipients,
      noRecipient: noRecipient,
      sendEmail: sendEmail,
      prefixSubject: prefixSubject,
      getReplyRecipients: getReplyRecipients,
      getReplyAllRecipients: getReplyAllRecipients,
      showReplyAllButton: showReplyAllButton,
      createReplyAllEmailObject: createQuotedEmail.bind(null, 'Re: ', getReplyAllRecipients),
      createReplyEmailObject: createQuotedEmail.bind(null, 'Re: ', getReplyRecipients)
    };
  })

  .service('draftService', function($q, $log, jmap, jmapClient, session, notificationFactory) {

    function saveDraftSuccess() {
      notificationFactory.weakInfo('Note', 'Your email has been saved as draft');
      return $q.when();
    }

    function saveDraftFailed(err) {
      notificationFactory.weakError('Error', 'Your email has not been saved');
      $log.error('A draft has not been saved', err);
      return $q.reject(err);
    }

    function haveDifferentRecipients(left, right) {

      function recipientToEmail(recipient) {
        return recipient.email;
      }

      function containsAll(from, to) {
        return from.every(function(email) {
          return to.indexOf(email) !== -1;
        });
      }

      var leftEmails = left.map(recipientToEmail);
      var rightEmails = right.map(recipientToEmail);

      return !containsAll(leftEmails, rightEmails) ||
             !containsAll(rightEmails, leftEmails);
    }

    function mapToNameEmailTuple(recipients) {
      return (recipients || []).map(function(recipient) {
        return {
          name: recipient.name,
          email: recipient.email
        };
      });
    }

    function Draft(originalEmailState) {
      this.originalEmailState = angular.copy(originalEmailState);
    }

    Draft.prototype.needToBeSaved = function(newEmailState) {
      var original = this.originalEmailState || {};
      original.rcpt = original.rcpt || {};
      original.subject = (original.subject || '').trim();
      original.htmlBody = (original.htmlBody || '').trim();

      var newest = newEmailState || {};
      newest.rcpt = newest.rcpt || {};
      newest.subject = (newest.subject || '').trim();
      newest.htmlBody = (newest.htmlBody || '').trim();

      return (
        original.subject !== newest.subject ||
        original.htmlBody !== newest.htmlBody ||
        haveDifferentRecipients(original.rcpt.to || [], newest.rcpt.to || []) ||
        haveDifferentRecipients(original.rcpt.cc || [], newest.rcpt.cc || []) ||
        haveDifferentRecipients(original.rcpt.bcc || [], newest.rcpt.bcc || [])
      );
    };

    Draft.prototype.save = function(newEmailState) {
      if (!this.needToBeSaved(newEmailState)) {
        return $q.reject();
      }
      return jmapClient
        .saveAsDraft(new jmap.OutboundMessage(jmapClient, {
          from: new jmap.EMailer({
            email: session.user.preferredEmail,
            name: session.user.name
          }),
          subject: newEmailState.subject,
          htmlBody: newEmailState.htmlBody,
          to: mapToNameEmailTuple(newEmailState.rcpt.to),
          cc: mapToNameEmailTuple(newEmailState.rcpt.cc),
          bcc: mapToNameEmailTuple(newEmailState.rcpt.bcc)
        }))
        .then(saveDraftSuccess, saveDraftFailed);
    };

    return {
      startDraft: function(originalEmailState) {
        return new Draft(originalEmailState);
      }
    };
  })

  .service('newComposerService', function($state, screenSize, boxOverlayOpener) {

    function choseByScreenSize(xs, others) {
      screenSize.is('xs') ? xs() : others();
    }

    function newMobileComposer(email) {
      $state.go('/unifiedinbox/compose', {email: email});
    }

    function newBoxedComposer() {
      boxOverlayOpener.open({
        title: 'Compose an email',
        templateUrl: '/unifiedinbox/views/composer/box-compose.html'
      });
    }

    function newBoxedDraftComposer(email) {
      newBoxedComposerCustomTitle('Continue your draft', email);
    }

    function newBoxedComposerCustomTitle(title, email) {
      boxOverlayOpener.open({
        title: title,
        templateUrl: '/unifiedinbox/views/composer/box-compose.html',
        email: email
      });
    }

    return {
      open: function() {
        choseByScreenSize(newMobileComposer, newBoxedComposer);
      },
      openDraft: function(email) {
        choseByScreenSize(
          newMobileComposer.bind(this, email),
          newBoxedDraftComposer.bind(this, email)
        );
      },
      openEmailCustomTitle: function(title, email) {
        choseByScreenSize(
          newMobileComposer.bind(this, email),
          newBoxedComposerCustomTitle.bind(this, title, email)
        );
      }
    };
  })

  .factory('Composition', function(session, draftService, emailSendingService, notificationFactory, Offline) {

    function addDisplayNameToRecipients(recipients) {
      return (recipients || []).map(function(recipient) {
        return {
          name: recipient.name,
          email: recipient.email,
          displayName: recipient.name || recipient.email
        };
      });
    }

    function prepareEmail(email) {
      var preparingEmail = angular.copy(email || {});
      preparingEmail.rcpt = {
        to: addDisplayNameToRecipients(preparingEmail.to),
        cc: addDisplayNameToRecipients(preparingEmail.cc),
        bcc: addDisplayNameToRecipients(preparingEmail.bcc)
      };
      return preparingEmail;
    }

    function Composition(message) {
      this.originalMessage = message;
      this.email = prepareEmail(message);
      this.draft = draftService.startDraft(this.email);
    }

    Composition.prototype.saveDraft = function() {
      this.draft.save(this.email).then(this.destroyOriginalDraft.bind(this));
    };

    Composition.prototype.getEmail = function() {
      return this.email;
    };

    Composition.prototype.canBeSentOrNotify = function() {
      if (emailSendingService.noRecipient(this.email.rcpt)) {
        notificationFactory.weakError('Note', 'Your email should have at least one recipient');
        return false;
      }

      if (!Offline.state || Offline.state === 'down') {
        notificationFactory.weakError('Note', 'Your device loses its Internet connection. Try later!');
        return false;
      }

      emailSendingService.removeDuplicateRecipients(this.email.rcpt);

      return true;
    };

    Composition.prototype.send = function() {
      if (!this.canBeSentOrNotify()) {
        return;
      }

      var self = this;
      this.email.from = session.user;

      var notify = notificationFactory.notify('info', 'Info', 'Sending', { from: 'bottom', align: 'right'}, 0);
      emailSendingService.sendEmail(this.email).then(
        function() {
          notify.close();
          notificationFactory.weakSuccess('Success', 'Your email has been sent');
          self.destroyOriginalDraft();
        },
        function() {
          notify.close();
          notificationFactory.weakError('Error', 'An error has occurred while sending email');
        }
      );
    };

    Composition.prototype.destroyOriginalDraft = function() {
      if (this.originalMessage) {
        this.originalMessage.destroy();
      }
    };

    return Composition;
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
    function quote(email) {
      var template = supportsRichtext() ? '/unifiedinbox/views/partials/quotes/richtext.html' : '/unifiedinbox/views/partials/quotes/plaintext.txt';

      return $templateRequest(template).then(function(template) {
        return $interpolate(template)({ email: email, dateFormat: 'medium', tz: localTimezone });
      });
    }

    function supportsRichtext() {
      return !deviceDetector.isMobile();
    }

    return {
      quote: quote,
      supportsRichtext: supportsRichtext
    };
  });
