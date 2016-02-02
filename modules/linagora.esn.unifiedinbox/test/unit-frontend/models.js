'use strict';

/* global chai: false, sinon: false */

var expect = chai.expect;

describe('The Unified Inbox Angular module models', function() {

  beforeEach(function() {
    angular.mock.module('linagora.esn.unifiedinbox');
  });

  describe('The Email factory', function() {
    var Email, mailboxesService;

    beforeEach(module(function($provide) {
      $provide.value('mailboxesService', mailboxesService = {
        flagIsUnreadChanged: sinon.spy()
      });
    }));

    beforeEach(inject(function(_Email_) {
      Email = _Email_;
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
