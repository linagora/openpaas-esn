'use strict';

/* global chai: false, sinon: false */

var expect = chai.expect;

describe('The inboxJmapItemService service', function() {

  var $rootScope, jmap, inboxJmapItemService, newComposerService, emailSendingService, quoteEmail, jmapClientMock,
      notificationFactory, counter, infiniteListService, inboxSelectionService, INFINITE_LIST_EVENTS, INBOX_EVENTS;

  beforeEach(module('linagora.esn.unifiedinbox'));

  beforeEach(module(function($provide) {
    counter = 0;
    jmapClientMock = {
      setMessages: sinon.spy(function() {
        return $q.when(new jmap.SetResponse(jmapClientMock));
      })
    };
    quoteEmail = function() { return {transformed: 'value'}; };

    $provide.value('withJmapClient', function(callback) { return callback(jmapClientMock); });
    $provide.value('newComposerService', newComposerService = { open: sinon.spy() });
    $provide.value('emailSendingService', emailSendingService = {
      createReplyEmailObject: sinon.spy(function(email) { return $q.when(quoteEmail(email)); }),
      createReplyAllEmailObject: sinon.spy(function(email) { return $q.when(quoteEmail(email)); }),
      createForwardEmailObject: sinon.spy(function(email) { return $q.when(quoteEmail(email)); })
    });
  }));

  beforeEach(inject(function(_$rootScope_, _jmap_, _inboxJmapItemService_, _notificationFactory_,
                             _infiniteListService_, _inboxSelectionService_, _INFINITE_LIST_EVENTS_, _INBOX_EVENTS_) {
    $rootScope = _$rootScope_;
    jmap = _jmap_;
    inboxJmapItemService = _inboxJmapItemService_;
    notificationFactory = _notificationFactory_;
    infiniteListService = _infiniteListService_;
    inboxSelectionService = _inboxSelectionService_;
    INFINITE_LIST_EVENTS = _INFINITE_LIST_EVENTS_;
    INBOX_EVENTS = _INBOX_EVENTS_;

    inboxSelectionService.unselectAllItems = sinon.spy(inboxSelectionService.unselectAllItems);
    infiniteListService.actionRemovingElements = sinon.spy(infiniteListService.actionRemovingElements);
    inboxJmapItemService.setFlag = sinon.spy(inboxJmapItemService.setFlag);
    notificationFactory.weakError = sinon.spy(notificationFactory.weakError);
  }));

  function newEmail(isUnread, isFlagged) {
    return new jmap.Message({}, 'id' + ++counter, 'threadId', ['inbox'], {
      subject: 'subject',
      isUnread: isUnread,
      isFlagged: isFlagged
    });
  }

  function mockSetMessages(rejectedIds) {
    jmapClientMock.setMessages = sinon.spy(function() {
      return $q.when(new jmap.SetResponse(jmapClientMock, { notUpdated: rejectedIds || {} }));
    });
  }

  describe('The moveToTrash function', function() {

    it('should reject if we cannot load the Trash mailbox', function(done) {
      jmapClientMock.getMailboxes = function() {
        return $q.reject();
      };

      inboxJmapItemService.moveToTrash([]).catch(done);
      $rootScope.$digest();
    });

    it('should move the message to the Trash mailbox', function(done) {
      jmapClientMock.getMailboxes = function() {
        return $q.when([new jmap.Mailbox({}, 'id_trash', 'name_trash', { role: 'trash' })]);
      };

      inboxJmapItemService.moveToTrash([
        new jmap.Message({}, 'id', 'trheadId', ['id_inbox'], { subject: 'subject' })
      ]).then(function() {
        expect(jmapClientMock.setMessages).to.have.been.calledWith({
          update: {
            id: {
              mailboxIds: ['id_trash']
            }
          }
        });

        done();
      });
      $rootScope.$digest();
    });

  });

  describe('The moveToMailbox function', function() {

    var inboxMailboxesService, mailbox;

    beforeEach(inject(function(_inboxMailboxesService_) {
      inboxMailboxesService = _inboxMailboxesService_;

      inboxMailboxesService.moveUnreadMessages = sinon.spy(inboxMailboxesService.moveUnreadMessages);
      mailbox = { id: 'mailboxId', name: 'inbox', displayName: 'inbox' };
    }));

    it('should notify with a single-item error message when setMessages fails for a single item', function(done) {
      mockSetMessages({
        id1: {
          type: 'invalidArguments'
        }
      });

      inboxJmapItemService.moveToMailbox(newEmail(), mailbox).catch(function() {
        expect(notificationFactory.weakError).to.have.been.calledWith('Error', 'Cannot move "subject" to "inbox"');

        done();
      });
      $rootScope.$digest();
    });

    it('should notify with a multiple-items error message when setMessages fails for multiple items', function(done) {
      mockSetMessages({
        id1: {
          type: 'invalidArguments'
        },
        id2: {
          type: 'notFound'
        }
      });

      inboxJmapItemService.moveToMailbox([newEmail(), newEmail()], mailbox).catch(function() {
        expect(notificationFactory.weakError).to.have.been.calledWith('Error', 'Some items could not be moved to "inbox"');

        done();
      });
      $rootScope.$digest();
    });

    it('should call setMessages with the correct options for a single item, and resolve when setMessages succeeds', function(done) {
      mockSetMessages();

      inboxJmapItemService.moveToMailbox(newEmail(), mailbox).then(function() {
        expect(jmapClientMock.setMessages).to.have.been.calledWith({
          update: {
            id1: { mailboxIds: ['mailboxId'] }
          }
        });

        done();
      });
      $rootScope.$digest();
    });

    it('should call setMessages with the correct options for multiple item, and resolve when setMessages succeeds', function(done) {
      mockSetMessages();

      inboxJmapItemService.moveToMailbox([newEmail(), newEmail(), newEmail()], mailbox).then(function() {
        expect(jmapClientMock.setMessages).to.have.been.calledWith({
          update: {
            id1: { mailboxIds: ['mailboxId'] },
            id2: { mailboxIds: ['mailboxId'] },
            id3: { mailboxIds: ['mailboxId'] }
          }
        });

        done();
      });
      $rootScope.$digest();
    });

    it('should update unread messages without waiting for a reply on all items', function(done) {
      var email = newEmail(true),
        email2 = newEmail(true);

      mockSetMessages();

      inboxJmapItemService.moveToMailbox([email, email2], mailbox).then(done);
      expect(inboxMailboxesService.moveUnreadMessages).to.have.been.calledTwice;
      expect(inboxMailboxesService.moveUnreadMessages).to.have.been.calledWith(['inbox'], ['mailboxId'], 1);
      expect(inboxMailboxesService.moveUnreadMessages).to.have.been.calledWith(['inbox'], ['mailboxId'], 1);

      $rootScope.$digest();
    });

    it('should revert the update of unread messages on failure, and rejects the promise', function(done) {
      var email = newEmail(true),
        email2 = newEmail(true);

      mockSetMessages({
        id1: {
          type: 'invalidArguments'
        }
      });

      inboxJmapItemService.moveToMailbox([email, email2], mailbox).catch(function() {
        expect(inboxMailboxesService.moveUnreadMessages).to.have.been.calledOnce;
        expect(inboxMailboxesService.moveUnreadMessages).to.have.been.calledWith(['mailboxId'], ['inbox'], 1);

        done();
      });
      inboxMailboxesService.moveUnreadMessages.reset();

      $rootScope.$digest();
    });

    it('should update mailboxIds and broadcast an event', function(done) {
      var message = newEmail();

      $rootScope.$on(INBOX_EVENTS.ITEM_MAILBOX_IDS_CHANGED, function(event, items) {
        expect(items).to.have.length(1);
        expect(items[0].mailboxIds).to.deep.equal(['mailboxId']);

        done();
      });

      inboxJmapItemService.moveToMailbox(message, mailbox);
      $rootScope.$digest();
    });

    it('should revert mailboxIds and broadcast an event on failure', function() {
      var message = newEmail(),
        eventHandler = sinon.spy();

      mockSetMessages({
        id1: {
          type: 'invalidArguments'
        }
      });

      $rootScope.$on(INBOX_EVENTS.ITEM_MAILBOX_IDS_CHANGED, eventHandler);

      inboxJmapItemService.moveToMailbox(message, mailbox);
      $rootScope.$digest();

      expect(eventHandler).to.have.been.calledTwice;
      expect(eventHandler).to.have.been.calledWith(sinon.match.any, [message]);
      expect(message.mailboxIds).to.deep.equal(['inbox']);
    });

  });

  describe('The moveMultipleItems function', function() {

    it('should delegate to infiniteListService.actionRemovingElements, moving all items', function(done) {
      var item1 = { id: 1, mailboxIds: [] },
        item2 = { id: 2, mailboxIds: [] },
        mailbox = { id: 'mailbox' };

      inboxJmapItemService.moveMultipleItems([item1, item2], mailbox).then(function() {
        expect(infiniteListService.actionRemovingElements).to.have.been.calledOnce;
        expect(jmapClientMock.setMessages).to.have.been.calledWith({
          update: {
            1: { mailboxIds: ['mailbox'] },
            2: { mailboxIds: ['mailbox'] }
          }
        });

        done();
      });
      $rootScope.$digest();
    });

    it('should only add failing items back to the list', function(done) {
      var item1 = { id: 1, mailboxIds: [] },
        item2 = { id: 2, mailboxIds: [] },
        mailbox = { id: 'mailbox' };

      mockSetMessages({
        2: {
          type: 'invalidArguments'
        }
      });

      $rootScope.$on(INFINITE_LIST_EVENTS.ADD_ELEMENTS, function(event, elements) {
        expect(elements).to.deep.equal([item2]);

        done();
      });

      inboxJmapItemService.moveMultipleItems([item1, item2], mailbox);
      $rootScope.$digest();
    });

    it('should restore all items when JMAP did not succeed', function(done) {
      var item1 = { id: 1, mailboxIds: [] },
        item2 = { id: 2, mailboxIds: [] },
        mailbox = { id: 'mailbox' };
      var itemsToRemove = [item1, item2];

      jmapClientMock.setMessages = function() { return $q.reject({}); };

      $rootScope.$on(INFINITE_LIST_EVENTS.ADD_ELEMENTS, function(event, elements) {
        expect(elements).to.deep.equal(itemsToRemove);

        done();
      });

      inboxJmapItemService.moveMultipleItems(itemsToRemove, mailbox);
      $rootScope.$digest();
    });

    it('should unselect all items', function() {
      inboxJmapItemService.moveMultipleItems([{ id: 1, mailboxIds: [] }], { id: 'mailbox' });

      expect(inboxSelectionService.unselectAllItems).to.have.been.calledWith();
    });

  });

  describe('The reply function', function() {

    it('should leverage open() and createReplyEmailObject()', function() {
      var inputEmail = { id: 'id', input: 'value' };
      inboxJmapItemService.reply(inputEmail);
      $rootScope.$digest();

      expect(emailSendingService.createReplyEmailObject).to.have.been.calledWith('id');
      expect(newComposerService.open).to.have.been.calledWith(quoteEmail(inputEmail));
    });

  });

  describe('The replyAll function', function() {

    it('should leverage open() and createReplyAllEmailObject()', function() {
      var inputEmail = { id: 'id', input: 'value' };
      inboxJmapItemService.replyAll(inputEmail);
      $rootScope.$digest();

      expect(emailSendingService.createReplyAllEmailObject).to.have.been.calledWith('id');
      expect(newComposerService.open).to.have.been.calledWith(quoteEmail(inputEmail));
    });

  });

  describe('The forward function', function() {

    it('should leverage open() and createForwardEmailObject()', function() {
      var inputEmail = { id: 'id', input: 'value' };
      inboxJmapItemService.forward(inputEmail);
      $rootScope.$digest();

      expect(emailSendingService.createForwardEmailObject).to.have.been.calledWith('id');
      expect(newComposerService.open).to.have.been.calledWith(quoteEmail(inputEmail));
    });

  });

  describe('The markAsUnread function', function() {

    it('should call setFlag', function() {
      var email = newEmail();

      inboxJmapItemService.markAsUnread(email);

      expect(inboxJmapItemService.setFlag).to.have.been.calledWith(email, 'isUnread', true);
    });

  });

  describe('The markAsRead function', function() {

    it('should call setFlag', function() {
      var email = newEmail();

      inboxJmapItemService.markAsRead(email);

      expect(inboxJmapItemService.setFlag).to.have.been.calledWith(email, 'isUnread', false);
    });
  });

  describe('The markAsFlagged function', function() {

    it('should call setFlag', function() {
      var email = newEmail();

      inboxJmapItemService.markAsFlagged(email);

      expect(inboxJmapItemService.setFlag).to.have.been.calledWith(email, 'isFlagged', true);
    });

  });

  describe('The unmarkAsFlagged function', function() {

    it('should call setFlag', function() {
      var email = newEmail();

      inboxJmapItemService.unmarkAsFlagged(email);

      expect(inboxJmapItemService.setFlag).to.have.been.calledWith(email, 'isFlagged', false);
    });

  });

  describe('The setFlag function', function() {

    it('should notify with a single-item error message when setMessages fails for a single item', function(done) {
      mockSetMessages({
        id1: {
          type: 'invalidArguments'
        }
      });

      inboxJmapItemService.setFlag(newEmail(), 'isUnread', true).catch(function() {
        expect(notificationFactory.weakError).to.have.been.calledWith('Error', 'Could not update "subject"');

        done();
      });
      $rootScope.$digest();
    });

    it('should notify with a multiple-items error message when setMessages fails for multiple items', function(done) {
      mockSetMessages({
        id1: {
          type: 'invalidArguments'
        },
        id2: {
          type: 'notFound'
        }
      });

      inboxJmapItemService.setFlag([newEmail(), newEmail()], 'isUnread', true).catch(function() {
        expect(notificationFactory.weakError).to.have.been.calledWith('Error', 'Some items could not be updated');

        done();
      });
      $rootScope.$digest();
    });

    it('should call setMessages with the correct options for a single item, and resolve when setMessages succeeds', function(done) {
      mockSetMessages();

      inboxJmapItemService.setFlag(newEmail(), 'isUnread', true).then(function() {
        expect(jmapClientMock.setMessages).to.have.been.calledWith({
          update: {
            id1: { isUnread: true }
          }
        });

        done();
      });
      $rootScope.$digest();
    });

    it('should call setMessages with the correct options for multiple item, and resolve when setMessages succeeds', function(done) {
      mockSetMessages();

      inboxJmapItemService.setFlag([newEmail(), newEmail(), newEmail()], 'isUnread', true).then(function() {
        expect(jmapClientMock.setMessages).to.have.been.calledWith({
          update: {
            id1: { isUnread: true },
            id2: { isUnread: true },
            id3: { isUnread: true }
          }
        });

        done();
      });
      $rootScope.$digest();
    });

    it('should change the flag without waiting for a reply on all items', function(done) {
      var email = newEmail(),
        email2 = newEmail();

      mockSetMessages();

      inboxJmapItemService.setFlag([email, email2], 'isUnread', true).then(done);
      expect(email.isUnread).to.equal(true);
      expect(email2.isUnread).to.equal(true);

      $rootScope.$digest();
    });

    it('should revert the flag on the failing email objects on failure, and rejects the promise', function(done) {
      var email = newEmail(),
        email2 = newEmail();

      mockSetMessages({
        id1: {
          type: 'invalidArguments'
        }
      });

      inboxJmapItemService.setFlag([email, email2], 'isUnread', true).catch(function() {
        expect(email.isUnread).to.equal(false);
        expect(email2.isUnread).to.equal(true);

        done();
      });
      $rootScope.$digest();
    });

    it('should broadcast an event with the updated flag', function(done) {
      var message = newEmail();

      $rootScope.$on(INBOX_EVENTS.ITEM_FLAG_CHANGED, function(event, items, flag, state) {
        expect(items).to.have.length(1);
        expect(items[0].isUnread).to.equal(true);
        expect(flag).to.equal('isUnread');
        expect(state).to.equal(true);

        done();
      });

      inboxJmapItemService.setFlag(message, 'isUnread', true);
      $rootScope.$digest();
    });

    it('should revert the flag and broadcast an event on failure', function() {
      var message = newEmail(),
        eventHandler = sinon.spy();

      mockSetMessages({
        id1: {
          type: 'invalidArguments'
        }
      });

      $rootScope.$on(INBOX_EVENTS.ITEM_FLAG_CHANGED, eventHandler);

      inboxJmapItemService.setFlag(message, 'isUnread', true);
      $rootScope.$digest();

      expect(eventHandler).to.have.been.calledWith(sinon.match.any, [message], 'isUnread', true);
      expect(eventHandler).to.have.been.calledWith(sinon.match.any, [message], 'isUnread', false);
      expect(message.isUnread).to.equal(false);
    });

  });

});
