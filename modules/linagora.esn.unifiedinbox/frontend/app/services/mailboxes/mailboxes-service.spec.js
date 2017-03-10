'use strict';

/* global chai: false, sinon: false */

var expect = chai.expect;

describe.only('The mailboxesService factory', function() {

  var inboxMailboxesCache, mailboxesService, jmapClient, $rootScope, jmap, Mailbox, notificationFactory;

  beforeEach(module('linagora.esn.unifiedinbox', function($provide) {
    jmapClient = {
      getMailboxes: function() { return $q.when([]); }
    };

    $provide.value('withJmapClient', function(callback) { return callback(jmapClient); });
    notificationFactory = {
      weakSuccess: sinon.spy(),
      weakError: sinon.spy(function() { return { setCancelAction: sinon.spy() }; }),
      strongInfo: sinon.spy(function() { return { close: sinon.spy() }; })
    };
    $provide.value('notificationFactory', notificationFactory);
  }));

  beforeEach(inject(function(_mailboxesService_, _$state_, _$rootScope_, _inboxMailboxesCache_, _jmap_, _Mailbox_, _notificationFactory_) {
    inboxMailboxesCache = _inboxMailboxesCache_;
    notificationFactory = _notificationFactory_;
    mailboxesService = _mailboxesService_;
    $rootScope = _$rootScope_;
    jmap = _jmap_;
    Mailbox = _Mailbox_;
  }));

  describe('The filterSystemMailboxes function', function() {

    it('should filter mailboxes with a known role', function() {
      var mailboxes = [
        { id: 1, role: { value: 'inbox' } },
        { id: 2, role: { } },
        { id: 3, role: { value: null } },
        { id: 4, role: { value: 'outbox' } }
      ];
      var expected = [
        { id: 2, role: { } },
        { id: 3, role: { value: null } }
      ];

      expect(mailboxesService.filterSystemMailboxes(mailboxes)).to.deep.equal(expected);
    });

    it('should return an empty array if an empty array is given', function() {
      expect(mailboxesService.filterSystemMailboxes([])).to.deep.equal([]);
    });

    it('should return an empty array if nothing is given', function() {
      expect(mailboxesService.filterSystemMailboxes()).to.deep.equal([]);
    });

  });

  describe('The isRestrictedMailbox function', function() {

    it('should return true for restricted mailboxes', function() {
      expect(mailboxesService.isRestrictedMailbox({ role: { value: 'drafts' }})).to.equal(true);
      expect(mailboxesService.isRestrictedMailbox({ role: { value: 'outbox' }})).to.equal(true);
    });

    it('should return false for non restricted mailboxes', function() {
      expect(mailboxesService.isRestrictedMailbox({ role: { value: 'inbox' }})).to.equal(false);
      expect(mailboxesService.isRestrictedMailbox({ role: { value: undefined }})).to.equal(false);
    });

  });

  describe('The assignMailboxesList function', function() {

    it('should return a promise', function(done) {
      mailboxesService.assignMailboxesList().then(function(mailboxes) {
        expect(mailboxes).to.deep.equal([]);

        done();
      });

      $rootScope.$digest();
    });

    it('should assign dst.mailboxes if dst is given', function(done) {
      var object = {};

      mailboxesService.assignMailboxesList(object).then(function() {
        expect(object.mailboxes).to.deep.equal([]);

        done();
      });

      $rootScope.$digest();
    });

    it('should assign dst.mailboxes if dst is given and dst.mailboxes does not exist yet', function(done) {
      var object = { mailboxes: 'Yolo' };

      mailboxesService.assignMailboxesList(object).then(function() {
        expect(object.mailboxes).to.equal('Yolo');

        done();
      });

      $rootScope.$digest();
    });

    it('should filter mailboxes using a filter, if given', function(done) {
      jmapClient.getMailboxes = function() {
        return $q.when([{}, {}, {}]);
      };
      mailboxesService.assignMailboxesList(null, function(mailboxes) {
        return mailboxes.slice(0, 1);
      }).then(function(mailboxes) {
        expect(mailboxes).to.have.length(1);

        done();
      });

      $rootScope.$digest();
    });

    it('should add level and qualifiedName properties to mailboxes', function(done) {
      jmapClient.getMailboxes = function() {
        return $q.when([
          { id: 1, name: '1' },
          { id: 2, name: '2', parentId: 1 },
          { id: 3, name: '3', parentId: 2 },
          { id: 4, name: '4' },
          { id: 5, name: '5', parentId: 1 }
        ]);
      };
      var expected = [
        { id: 1, name: '1', level: 1, qualifiedName: '1' },
        { id: 2, name: '2', parentId: 1, level: 2, qualifiedName: '1 / 2' },
        { id: 3, name: '3', parentId: 2, level: 3, qualifiedName: '1 / 2 / 3' },
        { id: 4, name: '4', level: 1, qualifiedName: '4' },
        { id: 5, name: '5', parentId: 1, level: 2, qualifiedName: '1 / 5' }
      ];

      mailboxesService.assignMailboxesList().then(function(mailboxes) {
        expect(mailboxes).to.deep.equal(expected);

        done();
      });

      $rootScope.$digest();
    });

    it('should not override mailboxes already present in cache', function(done) {
      inboxMailboxesCache[0] = { id: 2, name: '2', level: 2, parentId: 1, qualifiedName: '1 / 2' };
      jmapClient.getMailboxes = function() {
        return $q.when([
          { id: 1, name: '1' },
          { id: 4, name: '4' }
        ]);
      };
      var expected = [
        { id: 2, name: '2', level: 2, parentId: 1, qualifiedName: '1 / 2' },
        { id: 1, name: '1', level: 1, qualifiedName: '1' },
        { id: 4, name: '4', level: 1, qualifiedName: '4' }
      ];

      mailboxesService.assignMailboxesList().then(function(mailboxes) {
        expect(mailboxes).to.deep.equal(expected);

        done();
      });
      $rootScope.$digest();
    });

  });

  describe('The flagIsUnreadChanged function', function() {

    it('should do nothing if mail is undefined', function() {
      inboxMailboxesCache[0] = { id: 1, name: '1', unreadMessages: 1};

      mailboxesService.flagIsUnreadChanged();

      expect(inboxMailboxesCache[0].unreadMessages).to.equal(1);
    });

    it('should do nothing if status is undefined', function() {
      inboxMailboxesCache[0] = { id: 1, name: '1', unreadMessages: 1};

      mailboxesService.flagIsUnreadChanged({ mailboxIds: [1] });

      expect(inboxMailboxesCache[0].unreadMessages).to.equal(1);
    });

    it('should increase the unreadMessages in the mailboxesCache if status=true', function() {
      inboxMailboxesCache[0] = { id: 1, name: '1', unreadMessages: 1};

      mailboxesService.flagIsUnreadChanged({ mailboxIds: [1] }, true);

      expect(inboxMailboxesCache[0].unreadMessages).to.equal(2);
    });

    it('should decrease the unreadMessages in the mailboxesCache if status=false', function() {
      inboxMailboxesCache[0] = { id: 1, name: '1', unreadMessages: 1};

      mailboxesService.flagIsUnreadChanged({ mailboxIds: [1] }, false);

      expect(inboxMailboxesCache[0].unreadMessages).to.equal(0);
    });

    it('should guarantee that the unreadMessages in the mailboxesCache is never negative', function() {
      inboxMailboxesCache[0] = { id: 1, name: '1', unreadMessages: 0};

      mailboxesService.flagIsUnreadChanged({ mailboxIds: [1] }, false);

      expect(inboxMailboxesCache[0].unreadMessages).to.equal(0);
    });
  });

  describe('The assignMailbox function', function() {

    beforeEach(function() {
      jmapClient.getMailboxes = function() {
        return $q.when([{name: 'name'}]);
      };
    });

    it('should return a promise', function(done) {

      mailboxesService.assignMailbox().then(function() {

        done();
      });

      $rootScope.$digest();
    });

    it('should pass the mailbox.id to jmapClient.getMailboxes', function(done) {

      jmapClient.getMailboxes = function(data) {
        expect(data).to.deep.equal({ids: [2]});
        done();
      };

      mailboxesService.assignMailbox(2);
    });

    it('should not query the backend if useCache is true and the mailbox is already cached', function(done) {
      jmapClient.getMailboxes = sinon.spy();
      inboxMailboxesCache[0] = { id: 1, name: '1' };
      inboxMailboxesCache[1] = { id: 2, name: '2' };

      mailboxesService.assignMailbox(2, null, true).then(function(mailbox) {
        expect(jmapClient.getMailboxes).to.have.not.been.calledWith();
        expect(mailbox.name).to.equal('2');

        done();
      });
      $rootScope.$digest();
    });

    it('should assign dst.mailbox if dst is given', function(done) {
      var object = {};

      jmapClient.getMailboxes = function() {
        return $q.when([new jmap.Mailbox(jmapClient, 'id', 'name')]);
      };

      mailboxesService.assignMailbox('id', object).then(function() {
        expect(object.mailbox).to.shallowDeepEqual({
          id: 'id',
          name: 'name',
          level: 1,
          qualifiedName: 'name'
        });

        done();
      });

      $rootScope.$digest();
    });

    it('should assign dst.mailbox if dst is given and dst.mailbox does not exist yet', function(done) {
      var object = { mailbox: 'mailbox' };

      mailboxesService.assignMailbox(null, object).then(function() {
        expect(object.mailbox).to.equal('mailbox');

        done();
      });

      $rootScope.$digest();
    });

    it('should add level and qualifiedName properties to mailbox', function() {
      mailboxesService.assignMailbox().then(function() {
        expect(inboxMailboxesCache[0]).to.deep.equal({ name: 'name', level: 1, qualifiedName: 'name' });
      });

      $rootScope.$digest();
    });
  });

  describe('The moveUnreadMessages function', function() {

    it('should decrease unread messages of from mailboxes and increase it for to mailboxes', function() {
      var destObject = {};

      jmapClient.getMailboxes = function() {
        return $q.when([
          { id: 1, unreadMessages: 1},
          { id: 2, unreadMessages: 2}
        ]);
      };

      mailboxesService.assignMailboxesList(destObject);
      $rootScope.$digest();
      mailboxesService.moveUnreadMessages([1], [2], 1);

      expect(destObject.mailboxes).to.shallowDeepEqual([
        { id: 1, unreadMessages: 0},
        { id: 2, unreadMessages: 3}
      ]);
    });

  });

  describe('The canMoveMessage function', function() {

    var message, mailbox, draftMailbox, outboxMailbox;
    var inboxSpecialMailboxes;

    beforeEach(function() {
      message = {
        isDraft: false,
        mailboxIds: [0]
      };
      mailbox = {
        id: 1,
        role: {}
      };
    });

    beforeEach(inject(function(_inboxSpecialMailboxes_) {
      inboxSpecialMailboxes = _inboxSpecialMailboxes_;

      inboxSpecialMailboxes.get = function() {};

      draftMailbox = { id: 11, role: jmap.MailboxRole.DRAFTS };
      outboxMailbox = { id: 22, role: jmap.MailboxRole.OUTBOX };
      jmapClient.getMailboxes = function() {
        return $q.when([draftMailbox, outboxMailbox]);
      };
      mailboxesService.assignMailboxesList({});
      $rootScope.$digest();
    }));

    function checkResult(result) {
      expect(mailboxesService.canMoveMessage(message, mailbox)).to.equal(result);
    }

    it('should allow moving message to mailbox by default value', function() {
      checkResult(true);
    });

    it('should disallow moving draft message', function() {
      message.isDraft = true;
      checkResult(false);
    });

    it('should disallow moving message to same mailbox', function() {
      message.mailboxIds = [1, 2];
      checkResult(false);
    });

    it('should disallow moving message to Draft mailbox', function() {
      mailbox.role = jmap.MailboxRole.DRAFTS;
      checkResult(false);
    });

    it('should disallow moving message to Outbox mailbox', function() {
      mailbox.role = jmap.MailboxRole.OUTBOX;
      checkResult(false);
    });

    it('should disallow moving message out from Draft mailbox', function() {
      message.mailboxIds = [draftMailbox.id];
      checkResult(false);
    });

    it('should disallow moving message out from Outbox mailbox', function() {
      message.mailboxIds = [outboxMailbox.id];
      checkResult(false);
    });

    it('should allow moving message out from mailbox that is not in mailboxesCache', function() {
      message.mailboxIds = [99];
      checkResult(true);
    });

    it('should disallow moving message to special mailbox', function() {
      inboxSpecialMailboxes.get = function() {
        return { id: 'special mailbox id' };
      };
      checkResult(false);
    });

  });

  describe('The getMessageListFilter function', function() {

    var inboxSpecialMailboxes;

    beforeEach(inject(function(_inboxSpecialMailboxes_) {
      inboxSpecialMailboxes = _inboxSpecialMailboxes_;
    }));

    it('should filter message in the mailbox if input mailbox ID is not special one', function(done) {
      var mailboxId = '123';

      inboxSpecialMailboxes.get = function() {};

      mailboxesService.getMessageListFilter(mailboxId).then(function(filter) {
        expect(filter).to.deep.equal({ inMailboxes: [mailboxId] });
        done();
      });

      $rootScope.$digest();

    });

    it('should use filter of the mailbox if input mailbox ID is a special one', function(done) {
      var mailboxId = '123';
      var specialMailbox = {
        id: mailboxId,
        filter: { filter: 'condition' }
      };

      inboxSpecialMailboxes.get = function() {
        return specialMailbox;
      };

      mailboxesService.getMessageListFilter(mailboxId).then(function(filter) {
        expect(filter).to.deep.equal(specialMailbox.filter);
        done();
      });

      $rootScope.$digest();
    });

    it('should convert mailbox role to mailbox ID in filter of special mailbox in the first use', function(done) {
      var mailboxId = '123';
      var excludedMailboxRoles = [{ value: 'role' }, { value: 'not found role' }];
      var mailboxes = [{
        id: 'matched role',
        role: excludedMailboxRoles[0]
      }, {
        id: 'unmatched role',
        role: { value: 'unmatched role' }
      }];
      var specialMailbox = {
        id: mailboxId,
        filter: {
          unprocessed: true,
          notInMailboxes: excludedMailboxRoles
        }
      };

      inboxSpecialMailboxes.get = function() {
        return specialMailbox;
      };

      jmapClient.getMailboxes = sinon.stub().returns($q.when(mailboxes));

      mailboxesService.getMessageListFilter(mailboxId).then(function(filter) {
        expect(jmapClient.getMailboxes).to.have.been.calledWith();
        expect(filter).to.deep.equal({
          notInMailboxes: [mailboxes[0].id]
        });
        done();
      });

      $rootScope.$digest();
    });

    it('should use empty array in filter if JMAP client fails to get mailboxes', function(done) {
      var mailboxId = '123';
      var excludedMailboxRoles = [{ value: 'role' }];
      var specialMailbox = {
        id: mailboxId,
        filter: {
          unprocessed: true,
          notInMailboxes: excludedMailboxRoles
        }
      };

      inboxSpecialMailboxes.get = function() {
        return specialMailbox;
      };

      jmapClient.getMailboxes = sinon.stub().returns($q.reject());

      mailboxesService.getMessageListFilter(mailboxId).then(function(filter) {
        expect(jmapClient.getMailboxes).to.have.been.calledWith();
        expect(filter).to.deep.equal({
          notInMailboxes: []
        });
        done();
      });

      $rootScope.$digest();
    });

  });

  describe('The createMailbox function', function() {

    var mailbox = {
      id: 'id',
      name: 'name',
      parentId: 123,
      qualifiedName: 'name',
      level: 1
    };

    it('should call client.createMailbox', function(done) {
      jmapClient.createMailbox = function(name, parentId) {
        expect(name).to.equal('name');
        expect(parentId).to.equal(123);
        done();
      };

      mailboxesService.createMailbox(mailbox);
      $rootScope.$digest();
    });

    it('should not update the cache if the creation fails', function(done) {
      jmapClient.createMailbox = function() {
        return $q.reject();
      };

      mailboxesService.createMailbox('name', 123).then(null, function() {
        expect(inboxMailboxesCache.length).to.equal(0);

        done();
      });
      $rootScope.$digest();
    });

    it('should display an error notification with a "Reopen" link', function(done) {
      jmapClient.createMailbox = function() {
        return $q.reject();
      };
      mailboxesService.createMailbox(mailbox).then(null, function() {
        expect(notificationFactory.weakError).to.have.been.calledWith('Error', 'Creation of folder name failed');

        done();
      });
      $rootScope.$digest();
    });

    it('should update the cache with a qualified mailbox if the creation succeeds', function(done) {
      jmapClient.createMailbox = function(name, parentId) {
        return $q.when(new jmap.Mailbox(jmapClient, 'id', 'name', {
          parentId: parentId
        }));
      };

      mailboxesService.createMailbox(mailbox).then(function() {
        expect(inboxMailboxesCache).to.shallowDeepEqual([{
          id: 'id',
          name: 'name',
          parentId: 123,
          qualifiedName: 'name',
          level: 1
        }]);

        done();
      });
      $rootScope.$digest();
    });

  });

  describe('The destroyMailbox function', function() {

    it('should call client.setMailboxes, passing the mailbox id if it has no children', function(done) {
      jmapClient.setMailboxes = function(options) {
        expect(options).to.deep.equal({
          destroy: [123]
        });

        done();
      };

      mailboxesService.destroyMailbox(Mailbox({ id: 123, name: '123'}));
    });

    it('should destroy children mailboxes before the parent', function(done) {
      inboxMailboxesCache.push(Mailbox({ id: 1, parentId: 2, name: '1'}));
      jmapClient.setMailboxes = function(options) {
        expect(options).to.deep.equal({
          destroy: [1, 2]
        });

        done();
      };

      mailboxesService.destroyMailbox(Mailbox({ id: 2, name: '2'}));
    });

    it('should remove destroyed mailboxes from the cache, when call succeeds', function(done) {
      inboxMailboxesCache.push(Mailbox({ id: 1, parentId: 2, name: '1'}));
      inboxMailboxesCache.push(Mailbox({ id: 2, name: '2'}));
      jmapClient.setMailboxes = function() {
        return $q.when(new jmap.SetResponse(jmapClient, { destroyed: [1, 2] }));
      };

      mailboxesService.destroyMailbox(Mailbox({ id: 2, name: '2' })).then(function() {
        expect(inboxMailboxesCache).to.deep.equal([]);

        done();
      });
      $rootScope.$digest();
    });

    it('should remove destroyed mailboxes from the cache, when call does not succeed completely', function(done) {
      inboxMailboxesCache.push(Mailbox({ id: 1, parentId: 2, name: '1' }));
      inboxMailboxesCache.push(Mailbox({ id: 2, name: '2' }));
      jmapClient.setMailboxes = function() {
        return $q.when(new jmap.SetResponse(jmapClient, { destroyed: [1] }));
      };

      mailboxesService.destroyMailbox(Mailbox({ id: 2, name: '2' })).then(null, function() {
        expect(inboxMailboxesCache).to.deep.equal([{ id: 2, name: '2' }]);

        done();
      });
      $rootScope.$digest();
    });

  });

  describe('The updateMailbox function', function() {
    var originalMailbox;

    beforeEach(function() {
      originalMailbox = Mailbox({ id: 'id', name: 'name' });
    });

    it('should call client.updateMailbox, passing the new options', function(done) {
      jmapClient.updateMailbox = function(id, options) {
        expect(id).to.equal('id');
        expect(options).to.deep.equal({
          name: 'name',
          parentId: 123
        });

        done();
      };

      mailboxesService.updateMailbox(originalMailbox, { id: 'id', name: 'name', parentId: 123 });
    });

    it('should not update the cache if the update fails', function(done) {
      jmapClient.updateMailbox = function() {
        return $q.reject();
      };

      mailboxesService.updateMailbox(originalMailbox, { id: 'id', name: 'name' }).then(null, function() {
        expect(inboxMailboxesCache.length).to.equal(0);

        done();
      });
      $rootScope.$digest();
    });

    it('should update the cache with a qualified mailbox if the update succeeds', function(done) {
      jmapClient.updateMailbox = function() {
        return $q.when(new jmap.Mailbox(jmapClient, 'id', 'name'));
      };

      mailboxesService.updateMailbox(originalMailbox, { id: 'id', name: 'name' }).then(function() {
        expect(inboxMailboxesCache).to.shallowDeepEqual([{
          id: 'id',
          name: 'name',
          qualifiedName: 'name',
          level: 1
        }]);

        done();
      });
      $rootScope.$digest();
    });

    it('should update other mailboxes in cache when call succeeds, to reflect hierarchy changes', function(done) {
      inboxMailboxesCache.push(Mailbox({ id: '1', name: '1', qualifiedName: '1' }));
      inboxMailboxesCache.push(Mailbox({ id: '2', name: '2', parentId: '1', level: 2, qualifiedName: '1 / 2' }));
      inboxMailboxesCache.push(Mailbox({ id: '3', name: '3', parentId: '1', level: 2, qualifiedName: '1 / 3' }));
      inboxMailboxesCache.push(Mailbox({ id: '4', name: '4', parentId: '2', level: 3, qualifiedName: '1 / 2 / 4' }));
      jmapClient.updateMailbox = function() {
        return $q.when(new jmap.Mailbox(jmapClient, '1', '1_Renamed'));
      };

      mailboxesService.updateMailbox(originalMailbox, { id: '1', name: '1_Renamed' }).then(function() {
        expect(inboxMailboxesCache).to.shallowDeepEqual([{
          id: '1',
          name: '1_Renamed',
          qualifiedName: '1_Renamed',
          level: 1
        }, {
          id: '2',
          name: '2',
          qualifiedName: '1_Renamed / 2',
          level: 2
        }, {
          id: '3',
          name: '3',
          qualifiedName: '1_Renamed / 3',
          level: 2
        }, {
          id: '4',
          name: '4',
          qualifiedName: '1_Renamed / 2 / 4',
          level: 3
        }]);

        done();
      });
      $rootScope.$digest();
    });

  });

});
