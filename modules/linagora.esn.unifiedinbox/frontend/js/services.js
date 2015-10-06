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
  });
