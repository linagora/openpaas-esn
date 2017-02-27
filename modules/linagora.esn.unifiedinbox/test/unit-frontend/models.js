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
    var $rootScope, Email, mailboxesService, searchService, esnAvatarService;

    beforeEach(module(function($provide) {
      $provide.value('mailboxesService', mailboxesService = {
        flagIsUnreadChanged: sinon.spy()
      });
      $provide.value('searchService', searchService = {});
    }));

    beforeEach(inject(function(session, _$rootScope_, _Email_, _esnAvatarService_) {
      $rootScope = _$rootScope_;
      Email = _Email_;
      esnAvatarService = _esnAvatarService_;

      session.user = {
        firstname: 'user',
        lastname: 'using',
        preferredEmail: 'user@linagora.com'
      };
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

    function resolveAndCheckEmailer(object, key, values, done) {
      var i = 0,
          emailers = object[key];

      if (!Array.isArray(emailers)) {
        emailers = [emailers];
      }

      $q.all(emailers.map(function(emailer) {
        return emailer.resolve();
      })).then(function() {
        emailers.forEach(function(emailer) {
          expect(emailer).to.shallowDeepEqual({ // shallowDeepEqual to ignore the 'resolve' function
            name: values[i++],
            email: values[i++],
            avatarUrl: values[i++]
          });
        });
        expect(i).to.equal(values.length); // To check that the correct number of recipients were there

        done();
      });

      $rootScope.$digest();
    }

    it('should resolve the From emailer to someone in OpenPaas', function(done) {
      searchService.searchByEmail = function() {
        return $q.when({
          displayName: 'Display Name',
          photo: '/avatar/from'
        });
      };

      resolveAndCheckEmailer(new Email({ from: { email: 'from@linagora.com' }}), 'from', ['Display Name', 'from@linagora.com', '/avatar/from'], done);
    });

    it('should use defaults on the From emailer, if no match is found when resolving', function(done) {
      searchService.searchByEmail = function() { return $q.when(); };

      resolveAndCheckEmailer(new Email({ from: { name: 'Name', email: 'from@linagora.com' }}), 'from', ['Name', 'from@linagora.com', esnAvatarService.generateUrl('from@linagora.com', 'Name')], done);
    });

    it('should use defaults on the From emailer, if the match does not have photo or displayName', function(done) {
      searchService.searchByEmail = function() { return $q.when({}); };

      resolveAndCheckEmailer(new Email({ from: { email: 'from@linagora.com' }}), 'from', [undefined, 'from@linagora.com', esnAvatarService.generateUrl('from@linagora.com')], done);
    });

    it('should resolve the To emailers to people in OpenPaas', function(done) {
      searchService.searchByEmail = function(query) {
        return $q.when({
          displayName: 'Name ' + query,
          photo: '/avatar/' + query
        });
      };

      resolveAndCheckEmailer(new Email({ to: [{ email: 'first' }, { email: 'second' }], cc: [], bcc: [] }), 'to', ['Name first', 'first', '/avatar/first', 'Name second', 'second', '/avatar/second'], done);
    });

    it('should use defaults on the To emailers, if no matches are found when resolving', function(done) {
      searchService.searchByEmail = function() { return $q.when(); };

      resolveAndCheckEmailer(new Email({ to: [{ name: 'Name', email: 'to@linagora.com' }], cc: [], bcc: [] }), 'to', ['Name', 'to@linagora.com', esnAvatarService.generateUrl('to@linagora.com', 'Name')], done);
    });

    it('should use defaults on the To emailers, if the matches does not have photo or displayName', function(done) {
      searchService.searchByEmail = function() { return $q.when({}); };

      resolveAndCheckEmailer(new Email({ to: [{ email: 'to@linagora.com' }], cc: [], bcc: [] }), 'to', [undefined, 'to@linagora.com', esnAvatarService.generateUrl('to@linagora.com')], done);
    });

    it('should resolve the CC emailers to people in OpenPaas', function(done) {
      searchService.searchByEmail = function(query) {
        return $q.when({
          displayName: 'Name ' + query,
          photo: '/avatar/' + query
        });
      };

      resolveAndCheckEmailer(new Email({to: [], cc: [{ email: 'first' }, { email: 'second' }], bcc: [] }), 'cc', ['Name first', 'first', '/avatar/first', 'Name second', 'second', '/avatar/second'], done);
    });

    it('should use defaults on the CC emailers, if no matches are found when resolving', function(done) {
      searchService.searchByEmail = function() { return $q.when(); };

      resolveAndCheckEmailer(new Email({to: [], cc: [{ name: 'Name', email: 'to@linagora.com' }], bcc: [] }), 'cc', ['Name', 'to@linagora.com', esnAvatarService.generateUrl('to@linagora.com', 'Name')], done);
    });

    it('should use defaults on the CC emailers, if the matches does not have photo or displayName', function(done) {
      searchService.searchByEmail = function() { return $q.when({}); };

      resolveAndCheckEmailer(new Email({to: [], cc: [{ email: 'to@linagora.com' }], bcc: [] }), 'cc', [undefined, 'to@linagora.com', esnAvatarService.generateUrl('to@linagora.com')], done);
    });

    it('should resolve the BCC emailers to people in OpenPaas', function(done) {
      searchService.searchByEmail = function(query) {
        return $q.when({
          displayName: 'Name ' + query,
          photo: '/avatar/' + query
        });
      };

      resolveAndCheckEmailer(new Email({to: [], cc: [], bcc: [{ email: 'first' }, { email: 'second' }] }), 'bcc', ['Name first', 'first', '/avatar/first', 'Name second', 'second', '/avatar/second'], done);
    });

    it('should use defaults on the BCC emailers, if no matches are found when resolving', function(done) {
      searchService.searchByEmail = function() { return $q.when(); };

      resolveAndCheckEmailer(new Email({to: [], cc: [], bcc: [{ name: 'Name', email: 'to@linagora.com' }] }), 'bcc', ['Name', 'to@linagora.com', esnAvatarService.generateUrl('to@linagora.com', 'Name')], done);
    });

    it('should use defaults on the BCC emailers, if the matches does not have photo or displayName', function(done) {
      searchService.searchByEmail = function() { return $q.when({}); };

      resolveAndCheckEmailer(new Email({to: [], cc: [], bcc: [{ email: 'to@linagora.com' }] }), 'bcc', [undefined, 'to@linagora.com', esnAvatarService.generateUrl('to@linagora.com')], done);
    });

    it('should leave "from" alone if it is not defined', function() {
      expect(new Email({ id: 'id' }).from).to.equal(undefined);
    });

    it('should return a Selectable', function() {
      expect(new Email({ id: 'id' }).selectable).to.equal(true);
    });

    describe('The hasReplyAll attribute', function() {

      beforeEach(function() {

        searchService.searchByEmail = function() { return $q.when(); };
      });

      it('should allow replying all if there are more than one recipient', function() {
        var email = new Email({ id: 'id', to: [{ email: 'bob@email.com' }], cc: [{ email: 'alice@email.com' }] });

        expect(email.hasReplyAll).to.equal(true);
      });

      it('should allow replying all if the user is not the single recipient', function() {
        var email = new Email({ id: 'id', to: [{ email: 'bob@email.com' }], cc: [] });

        expect(email.hasReplyAll).to.equal(true);
      });

      it('should not allow replying all if the user is the single recipient', function() {
        var email = new Email({ id: 'id', to: [{ email: 'user@linagora.com' }], cc: [] });

        expect(email.hasReplyAll).to.equal(false);
      });

    });

  });

  describe('The Thread factory', function() {
    var Thread;

    beforeEach(inject(function(_Thread_) {
      Thread = _Thread_;
    }));

    it('should have id, mailboxIds, subject and emails properties', function() {
      var thread = new Thread({ id: 'threadId' }, [{ subject: 'firstEmailSubject', mailboxIds: ['1'] }, { subject: 'secondSubject' }]);

      expect(thread).to.shallowDeepEqual({
        id: 'threadId',
        mailboxIds: ['1'],
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

    it('should have mailboxIds set to an empty array when no emails are given', function() {
      expect(new Thread({ id: 'threadId' }, null).mailboxIds).to.deep.equal([]);
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

    it('should have hasAttachment=false when no email', function() {
      expect(new Thread({}, []).hasAttachment).to.equal(false);
    });

    it('should have hasAttachment=false when the last email has no attachment', function() {
      expect(new Thread({}, [{ hasAttachment: true }, { hasAttachment: false }]).hasAttachment).to.equal(false);
    });

    it('should have hasAttachment=true when the last email has attachment', function() {
      expect(new Thread({}, [{ hasAttachment: false }, { hasAttachment: true }]).hasAttachment).to.equal(true);
    });

    it('should return a Selectable', function() {
      expect(new Thread({ id: 'id' }).selectable).to.equal(true);
    });

    describe('The setEmails function', function() {

      it('should replace thread.emails', function() {
        var thread = new Thread({});

        expect(thread.emails.length).to.equal(0);
        thread.setEmails([{ hasAttachment: false }, { hasAttachment: true }]);
        expect(thread.emails.length).to.equal(2);
      });

      it('should replace thread.subject', function() {
        var thread = new Thread({}, [{ subject: 'subject1' }]);

        expect(thread.subject).to.equal('subject1');
        thread.setEmails([{ subject: 'subject2' }]);
        expect(thread.subject).to.equal('subject2');
      });

      it('should replace thread.lastEmail', function() {
        var thread = new Thread({}, [{ id: '1' }, { id: '2' }]);

        expect(thread.lastEmail.id).to.equal('2');
        thread.setEmails([{ id: '3' }]);
        expect(thread.lastEmail.id).to.equal('3');
      });

      it('should replace thread.hasAttachment', function() {
        var thread = new Thread({}, [{ hasAttachment: false }, { hasAttachment: true }]);

        expect(thread.hasAttachment).to.equal(true);
        thread.setEmails([{ hasAttachment: false }]);
        expect(thread.hasAttachment).to.equal(false);
      });

    });

  });

  describe('The Selectable factory', function() {

    var $rootScope, Selectable, INBOX_EVENTS;

    beforeEach(inject(function(_$rootScope_, _Selectable_, _INBOX_EVENTS_) {
      $rootScope = _$rootScope_;
      Selectable = _Selectable_;
      INBOX_EVENTS = _INBOX_EVENTS_;
    }));

    it('should set selectable=true on the source item', function() {
      expect(new Selectable({}).selectable).to.equal(true);
    });

    it('should broadcast a ITEM_SELECTION_CHANGED event when selected flag changes on the item', function(done) {
      var selectable = new Selectable({});

      $rootScope.$on(INBOX_EVENTS.ITEM_SELECTION_CHANGED, function(event, item) {
        expect(item).to.deep.equal({ selected: true, selectable: true });

        done();
      });

      selectable.selected = true;
    });

    it('should not broadcast a ITEM_SELECTION_CHANGED event when selected flag does not change on the item', function(done) {
      var selectable = new Selectable({});

      $rootScope.$on(INBOX_EVENTS.ITEM_SELECTION_CHANGED, done);

      selectable.selected = false;
      done();
    });

  });

  describe('The Emailer factory', function() {
    var $rootScope, Emailer, searchService;

    beforeEach(module(function($provide) {
      $provide.value('searchService', searchService = {
        searchByEmail: sinon.spy(function() { return $q.when(); })
      });
    }));

    beforeEach(inject(function(_$rootScope_, _Emailer_) {
      Emailer = _Emailer_;
      $rootScope = _$rootScope_;
    }));

    it('should resolve the emailer only once', function(done) {
      var emailer = new Emailer({
        from: {
          email: 'a@a.com'
        }
      });

      $q.all([emailer.resolve(), emailer.resolve(), emailer.resolve()]).then(function() {
        expect(searchService.searchByEmail).to.have.been.calledOnce;

        done();
      });
      $rootScope.$digest();
    });

  });

  describe('The Mailbox factory', function() {

    var Mailbox, inboxMailboxesCache;

    beforeEach(module(function($provide) {
      $provide.constant('INBOX_DISPLAY_NAME_SIZE', 10);
    }));

    beforeEach(inject(function(_Mailbox_, _inboxMailboxesCache_) {
      Mailbox = _Mailbox_;
      inboxMailboxesCache = _inboxMailboxesCache_;
    }));

    describe('mailbox.displayName property', function() {

      it('should leverage name property', function() {
        expect(Mailbox({ name: 'm1' }).displayName).to.equal('m1');
      });

      it('should return undefined when name.length is 0', function() {
        expect(Mailbox({}).displayName).to.be.undefined;
      });

      it('should be ellipsesed when name.length > INBOX_DISPLAY_NAME_SIZE', function() {
        expect(Mailbox({ name: '112233445566778899' }).displayName).to.equal('1122334455...');
      });

      it('should be configurable', function() {
        var mailbox = Mailbox({ name: 'm1' });

        delete mailbox.displayName;
        expect(mailbox.displayName).to.be.undefined;
      });

    });

    describe('mailbox.descendants property', function() {
      it('should be configurable', function() {
        var mailbox = Mailbox({ name: 'm1' });

        delete mailbox.descendants;
        expect(mailbox.descendants).to.be.undefined;
      });

      it('mailbox.descendants should return empty array if the cache is empty', function() {
        expect(Mailbox({ id: 'm1' }).descendants).to.deep.equal([]);
      });

      it('mailbox.descendants should return empty array if the mailbox has no child', function() {
        inboxMailboxesCache.push({ parentId: 'm2' });

        expect(Mailbox({ id: 'm1' }).descendants).to.deep.equal([]);
      });

      it('mailbox.descendants should return an array of descendants in the right order', function() {
        var mailboxId = 'm1';
        var descendants = [{
          id: 'c1',
          parentId: mailboxId
        }, {
          id: 'c3',
          parentId: mailboxId
        }, {
          id: 'c11',
          parentId: 'c1'
        }, {
          id: 'c12',
          parentId: 'c1'
        }, {
          id: 'c31',
          parentId: 'c3'
        }];

        inboxMailboxesCache.push({ parentId: 'm2' });
        descendants.forEach(Array.prototype.push.bind(inboxMailboxesCache));

        expect(Mailbox({ id: mailboxId }).descendants).to.deep.equal(descendants);
      });

      it('mailbox.descendants should cache the results of the computation', function() {
        var mailboxId = 'm1';
        var descendants = [{
          id: 'c1',
          parentId: mailboxId
        }, {
          id: 'c3',
          parentId: mailboxId
        }, {
          id: 'c11',
          parentId: 'c1'
        }, {
          id: 'c12',
          parentId: 'c1'
        }, {
          id: 'c31',
          parentId: 'c3'
        }];
        var mailbox = Mailbox({ id: mailboxId });

        inboxMailboxesCache.push({ parentId: 'm2' });
        descendants.forEach(Array.prototype.push.bind(inboxMailboxesCache));

        expect(mailbox.descendants).to.deep.equal(descendants);

        inboxMailboxesCache.length = 0;

        expect(mailbox.descendants).to.deep.equal(descendants);
      });
    });
  });

});
