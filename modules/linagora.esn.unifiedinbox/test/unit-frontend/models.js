'use strict';

/* global chai: false, sinon: false */

var expect = chai.expect;

describe('The Unified Inbox Angular module models', function() {

  beforeEach(function() {
    angular.mock.module('esn.core');
    angular.mock.module('esn.configuration');
    angular.mock.module('linagora.esn.unifiedinbox');
  });

  describe('The Email factory', function() {
    var $rootScope, Email, mailboxesService, searchService, INBOX_DEFAULT_AVATAR;

    beforeEach(module(function($provide) {
      $provide.value('mailboxesService', mailboxesService = {
        flagIsUnreadChanged: sinon.spy()
      });
      $provide.value('searchService', searchService = {});
    }));

    beforeEach(inject(function(_$rootScope_, _Email_, _INBOX_DEFAULT_AVATAR_) {
      $rootScope = _$rootScope_;
      Email = _Email_;
      INBOX_DEFAULT_AVATAR = _INBOX_DEFAULT_AVATAR_;
    }));

    it('should have a correct initial value for isUnread', function() {
      expect(new Email({ id: 'id', isUnread: true }).isUnread).to.equal(true);
    });

    it('should call mailboxesService when isUnread is written, if value changes', function() {
      var email = new Email({ id: 'id', isUnread: true });

      email.isUnread = false;

      expect(mailboxesService.flagIsUnreadChanged).to.have.been.calledWith(email, false);
    });

    it('should not call mailboxesService when isUnread is written, if value does not change', function() {
      new Email({ id: 'id', isUnread: false }).isUnread = false;

      expect(mailboxesService.flagIsUnreadChanged).to.not.have.been.calledWith();
    });

    function resolveAndCheckEmailer(object, key, values) {
      var i = 0,
          emailers = object[key];

      if (!Array.isArray(emailers)) {
        emailers = [emailers];
      }

      $rootScope.$digest();
      emailers.forEach(function(emailer) {
        expect(emailer).to.deep.equal({
          name: values[i++],
          email: values[i++],
          avatarUrl: values[i++]
        });
      });
      expect(i).to.equal(values.length); // To check that the correct number of recipients were there
    }

    it('should resolve the From emailer to someone in OpenPaas', function() {
      searchService.searchByEmail = function() {
        return $q.when({
          displayName: 'Display Name',
          photo: '/avatar/from'
        });
      };

      resolveAndCheckEmailer(new Email({ from: { email: 'from@linagora.com' }}), 'from', ['Display Name', 'from@linagora.com', '/avatar/from']);
    });

    it('should use defaults on the From emailer, if no match is found when resolving', function() {
      searchService.searchByEmail = function() { return $q.when(); };

      resolveAndCheckEmailer(new Email({ from: { name: 'Name', email: 'from@linagora.com' }}), 'from', ['Name', 'from@linagora.com', INBOX_DEFAULT_AVATAR]);
    });

    it('should use defaults on the From emailer, if the match does not have photo or displayName', function() {
      searchService.searchByEmail = function() { return $q.when({}); };

      resolveAndCheckEmailer(new Email({ from: { email: 'from@linagora.com' }}), 'from', [undefined, 'from@linagora.com', INBOX_DEFAULT_AVATAR]);
    });

    it('should resolve the To emailers to people in OpenPaas', function() {
      searchService.searchByEmail = function(query) {
        return $q.when({
          displayName: 'Name ' + query,
          photo: '/avatar/' + query
        });
      };

      resolveAndCheckEmailer(new Email({ to: [{ email: 'first' }, { email: 'second' }] }), 'to', ['Name first', 'first', '/avatar/first', 'Name second', 'second', '/avatar/second']);
    });

    it('should use defaults on the To emailers, if no matches are found when resolving', function() {
      searchService.searchByEmail = function() { return $q.when(); };

      resolveAndCheckEmailer(new Email({ to: [{ name: 'Name', email: 'to@linagora.com' }] }), 'to', ['Name', 'to@linagora.com', INBOX_DEFAULT_AVATAR]);
    });

    it('should use defaults on the To emailers, if the matches does not have photo or displayName', function() {
      searchService.searchByEmail = function() { return $q.when({}); };

      resolveAndCheckEmailer(new Email({ to: [{ email: 'to@linagora.com' }] }), 'to', [undefined, 'to@linagora.com', INBOX_DEFAULT_AVATAR]);
    });

    it('should resolve the CC emailers to people in OpenPaas', function() {
      searchService.searchByEmail = function(query) {
        return $q.when({
          displayName: 'Name ' + query,
          photo: '/avatar/' + query
        });
      };

      resolveAndCheckEmailer(new Email({ cc: [{ email: 'first' }, { email: 'second' }] }), 'cc', ['Name first', 'first', '/avatar/first', 'Name second', 'second', '/avatar/second']);
    });

    it('should use defaults on the CC emailers, if no matches are found when resolving', function() {
      searchService.searchByEmail = function() { return $q.when(); };

      resolveAndCheckEmailer(new Email({ cc: [{ name: 'Name', email: 'to@linagora.com' }] }), 'cc', ['Name', 'to@linagora.com', INBOX_DEFAULT_AVATAR]);
    });

    it('should use defaults on the CC emailers, if the matches does not have photo or displayName', function() {
      searchService.searchByEmail = function() { return $q.when({}); };

      resolveAndCheckEmailer(new Email({ cc: [{ email: 'to@linagora.com' }] }), 'cc', [undefined, 'to@linagora.com', INBOX_DEFAULT_AVATAR]);
    });

    it('should resolve the BCC emailers to people in OpenPaas', function() {
      searchService.searchByEmail = function(query) {
        return $q.when({
          displayName: 'Name ' + query,
          photo: '/avatar/' + query
        });
      };

      resolveAndCheckEmailer(new Email({ bcc: [{ email: 'first' }, { email: 'second' }] }), 'bcc', ['Name first', 'first', '/avatar/first', 'Name second', 'second', '/avatar/second']);
    });

    it('should use defaults on the BCC emailers, if no matches are found when resolving', function() {
      searchService.searchByEmail = function() { return $q.when(); };

      resolveAndCheckEmailer(new Email({ bcc: [{ name: 'Name', email: 'to@linagora.com' }] }), 'bcc', ['Name', 'to@linagora.com', INBOX_DEFAULT_AVATAR]);
    });

    it('should use defaults on the BCC emailers, if the matches does not have photo or displayName', function() {
      searchService.searchByEmail = function() { return $q.when({}); };

      resolveAndCheckEmailer(new Email({ bcc: [{ email: 'to@linagora.com' }] }), 'bcc', [undefined, 'to@linagora.com', INBOX_DEFAULT_AVATAR]);
    });

    describe('The hasReplyAll attribute', function() {

      var recipients;

      beforeEach(function() {
        recipients = [{ email: 'bob@email.com' }, { email: 'alice@email.com' }];

        searchService.searchByEmail = function() { return $q.when(); };
      });

      it('should allow replying all if there are more than one recipient', function() {
        var email = new Email({ id: 'id', to: [recipients[0]], cc: [recipients[1]] });

        expect(email.hasReplyAll).to.be.true;
      });

      it('should not allow replying all if there is only one recipient', function() {
        var email = new Email({ id: 'id', to: [recipients[0]], cc: [] });

        expect(email.hasReplyAll).to.be.false;
      });

    });

  });

  describe('The Thread factory', function() {
    var Thread;

    beforeEach(inject(function(_Thread_) {
      Thread = _Thread_;
    }));

    it('should have id, subject and emails properties', function() {
      var thread = new Thread({ id: 'threadId' }, [{ subject: 'firstEmailSubject' }, { subject: 'secondSubject' }]);

      expect(thread).to.shallowDeepEqual({
        id: 'threadId',
        subject: 'firstEmailSubject',
        emails: [{ subject: 'firstEmailSubject' }, { subject: 'secondSubject' }]
      });
    });

    it('should have emails set to an empty array when undefined is given', function() {
      expect(new Thread({ id: 'threadId' }).emails).to.deep.equal([]);
    });

    it('should have emails set to an empty array when null is given', function() {
      expect(new Thread({ id: 'threadId' }, null).emails).to.deep.equal([]);
    });

    it('should have subject set to an empty string when no emails are given', function() {
      expect(new Thread({ id: 'threadId' }, null).subject).to.equal('');
    });

    it('should have isUnread=true if at least one email is unread', function() {
      expect(new Thread({}, [{ isUnread: true }, { isUnread: false }]).isUnread).to.equal(true);
    });

    it('should have isUnread=true if all emails are unread', function() {
      expect(new Thread({}, [{ isUnread: true }, { isUnread: true }]).isUnread).to.equal(true);
    });

    it('should have isUnread=false if all emails are read', function() {
      expect(new Thread({}, [{ isUnread: false }, { isUnread: false }]).isUnread).to.equal(false);
    });

    it('should have isFlagged=true if at least one email is flagged', function() {
      expect(new Thread({}, [{ isFlagged: true }, { isFlagged: false }]).isFlagged).to.equal(true);
    });

    it('should have isFlagged=true if all emails are flagged', function() {
      expect(new Thread({}, [{ isFlagged: true }, { isFlagged: true }]).isFlagged).to.equal(true);
    });

    it('should have isFlagged=false if all emails are not flagged', function() {
      expect(new Thread({}, [{ isFlagged: false }, { isFlagged: false }]).isFlagged).to.equal(false);
    });

  });

});
