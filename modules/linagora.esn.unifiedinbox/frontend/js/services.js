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

  .factory('emailSendingService', function(emailService) {

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

    return {
      ensureEmailAndNameFields: ensureEmailAndNameFields,
      emailsAreValid: emailsAreValid,
      removeDuplicateRecipients: removeDuplicateRecipients,
      noRecipient: noRecipient
    };
  })

  .service('draftService', function($log, jmap, jmapClient, session, notificationFactory) {

    function saveDraftSuccess() {
      notificationFactory.weakInfo('Note', 'Your email has been saved as draft');
    }

    function saveDraftFailed(err) {
      notificationFactory.weakError('Error', 'Your email has not been saved');
      $log.error('A draft has not been saved', err);
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
        JSON.stringify(original.rcpt.to || []) !== JSON.stringify(newest.rcpt.to || []) ||
        JSON.stringify(original.rcpt.cc || []) !== JSON.stringify(newest.rcpt.cc || []) ||
        JSON.stringify(original.rcpt.bcc || []) !== JSON.stringify(newest.rcpt.bcc || [])
      );
    };

    Draft.prototype.save = function(newEmailState) {
      if (!this.needToBeSaved(newEmailState)) {
        return;
      }
      jmapClient
        .saveAsDraft(new jmap.OutboundMessage(jmapClient, {
          from: new jmap.EMailer({
            email: session.user.preferredEmail,
            name: session.user.name
          }),
          subject: newEmailState.subject,
          htmlBody: newEmailState.htmlBody,
          to: newEmailState.rcpt.to,
          cc: newEmailState.rcpt.cc,
          bcc: newEmailState.rcpt.bcc
        }))
        .then(saveDraftSuccess, saveDraftFailed);
    };

    return {
      startDraft: function(originalEmailState) {
        return new Draft(originalEmailState);
      }
    };
  });
