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

  .factory('emailSendingService', function($q, $http, emailService) {

    /**
     * Set the recipient.email and recipient.name fields to
     * recipient.displayName if they are undefined.
     * @param {recipient object} recipient
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
     * Add the following logic when sending an email:
     * Check for an invalid email used as a recipient
     * @param {recipient object} rcpt
     */
    function emailsAreValid(rcpt) {
      if (!rcpt) {
        return false;
      }

      rcpt.to = rcpt.to || [];
      rcpt.cc = rcpt.cc || [];
      rcpt.bcc = rcpt.bcc || [];

      function isValidTagEmail(tag) {
        return emailService.isValidEmail(tag.email);
      }

      var combinedList = [rcpt.to, rcpt.cc, rcpt.bcc];
      return combinedList.every(function(emails) {
        return emails.every(isValidTagEmail);
      });
    }

    /**
     * Add the following logic when sending an email:
     *  Add the same recipient multiple times, in multiples fields (TO, CC...): allowed.
     *  This multi recipient must receive the email as a TO > CC > BCC recipient in this order.
     *  If the person is in TO and CC, s/he receives as TO. If s/he is in CC/BCC, receives as CC, etc).
     * @param {recipient object} rcpt
     */
    function removeDuplicateRecipients(rcpt) {
      var itemContainedInArray = function(array, item) {
        return array.indexOf(item) !== -1;
      };

      if (!rcpt) {
        return;
      }

      rcpt.to = rcpt.to || [];
      rcpt.cc = rcpt.cc || [];
      rcpt.bcc = rcpt.bcc || [];

      var toEmailsList = rcpt.to.map(function(item) {
        return item.email;
      });
      var ccEmailsList = rcpt.cc.map(function(item) {
        return item.email;
      });

      rcpt.cc = rcpt.cc.filter(function(item) {
        return !itemContainedInArray(toEmailsList, item.email);
      });
      rcpt.bcc = rcpt.bcc.filter(function(item) {
        return !itemContainedInArray(toEmailsList, item.email) && !itemContainedInArray(ccEmailsList, item.email);
      });
    }

    /**
     * Add the following logic to email sending:
     * check whether the user is trying to send an email with no recipient at all
     * @param {recipient object} rcpt
     */
    function noRecipient(rcpt) {
      if (!rcpt) {
        return true;
      }

      rcpt.to = rcpt.to || [];
      rcpt.cc = rcpt.cc || [];
      rcpt.bcc = rcpt.bcc || [];

      if (rcpt.to.length === 0 && rcpt.cc.length === 0 && rcpt.bcc.length === 0) {
        return true;
      }
      return false;
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

    return {
      ensureEmailAndNameFields: ensureEmailAndNameFields,
      emailsAreValid: emailsAreValid,
      removeDuplicateRecipients: removeDuplicateRecipients,
      noRecipient: noRecipient,
      sendEmail: sendEmail
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

  .service('newComposerService', function($location, $timeout, screenSize, boxOverlayOpener) {

    function choseByScreenSize(xs, others) {
      screenSize.is('xs') ? xs.apply() : others.apply();
    }

    function newMobileComposer(emailId) {
      $timeout(function() {
        $location.path('/unifiedinbox/compose' + (emailId ? '/' + emailId : ''));
      });
    }

    function newBoxedComposer() {
      boxOverlayOpener.open({
        title: 'Compose an email',
        templateUrl: '/unifiedinbox/views/composer/box-compose.html'
      });
    }

    function newBoxedDraftComposer(email) {
      boxOverlayOpener.open({
        title: 'Continue your draft',
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
          newMobileComposer.bind(this, email.id),
          newBoxedDraftComposer.bind(this, email)
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
  });
