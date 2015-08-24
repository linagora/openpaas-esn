'use strict';

angular.module('linagora.esn.unifiedinbox')

  .service('JmapAuth', function(session, jmap) {

    var accessToken = 'ba9b0e4c-3501-11e5-b419-0242ac110012';
    var jmapServerUrl = 'http://localhost:8888';

    this.login = function() {
      var userEmail = session.user.emails[0];
      jmap.login(userEmail, accessToken, jmapServerUrl);
    };

  })

  .factory('EmailGroupingTool', function(moment) {

    function EmailGroupingTool(options) {
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
      return this;
    }

    EmailGroupingTool.prototype.addEmail = function addEmail(jmapEmail) {
      var email = {
        from: jmapEmail.get('from'),
        subject: jmapEmail.get('subject'),
        preview: jmapEmail.get('preview'),
        hasAttachment: jmapEmail.get('hasAttachment'),
        isUnread: jmapEmail.get('isUnread'),
        date: jmapEmail.get('date')
      };
      var currentMoment = moment(Date.now());
      var emailMoment = moment(email.date);

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

  .factory('JmapMailboxes', function($q, jmap, MAILBOX_ROLE_ORDERING_WEIGHT) {

    function listMailboxes() {
      var deferred = $q.defer();
      jmap.listMailboxes(function(mailboxes) {
        if (mailboxes.length === 0) {
          // mailboxes are not yet available
          return;
        }
        deferred.resolve(mailboxes.map(function(box) {
          return {
            name: box.get('name'),
            role: box.get('role'),
            href: '/#/unifiedinbox/' + box.get('id'),
            unreadMessages: box.get('unreadMessages'),
            orderingWeight: MAILBOX_ROLE_ORDERING_WEIGHT[box.get('role') || 'default']
          };
        }));
      });
      return deferred.promise;
    }

    return {
      get: listMailboxes
    };
  })

  .factory('JmapEmails', function($timeout, jmap, EmailGroupingTool) {

    function listEmails(mailbox) {
      var emailGroupingTool = new EmailGroupingTool();
      var options = {
        filter: {inMailboxes: [mailbox]},
        sort: ['date desc'],
        collapseThreads: true,
        position: 0,
        limit: 100
      };

      jmap.listEmails(options, function(query) {
        $timeout(function() {
          if (query.position === 0) {
            emailGroupingTool.reset();
          }
          query.forEach(function(email) {
            // only display emails with data yet available
            if (email && email.get('subject')) {
              emailGroupingTool.addEmail(email);
            }
          });
        });
      });

      return emailGroupingTool.getGroupedEmails();
    }

    return {
      get: listEmails
    };
  })

  .factory('JmapAPI', function(JmapAuth, JmapMailboxes, JmapEmails) {

    function getMailboxes() {
      JmapAuth.login();
      return JmapMailboxes.get();
    }

    function getEmails(mailbox) {
      JmapAuth.login();
      return JmapEmails.get(mailbox);
    }

    return {
      getMailboxes: getMailboxes,
      getEmails: getEmails
    };

  });
