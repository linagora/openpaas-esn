'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The inboxSpecialMailboxes factory', function() {

  var inboxSpecialMailboxes;

  beforeEach(module('linagora.esn.unifiedinbox'));

  beforeEach(inject(function(_inboxSpecialMailboxes_) {
    inboxSpecialMailboxes = _inboxSpecialMailboxes_;
  }));

  describe('The list fn', function() {

    it('should return an array of special mailboxes with fake data', function() {
      var specialMailboxes = inboxSpecialMailboxes.list();

      expect(specialMailboxes).to.be.an.instanceof(Array);
      expect(specialMailboxes.length).to.equal(1);
      expect(specialMailboxes[0]).to.shallowDeepEqual({
        id: 'all',
        name: 'All Mail',
        role: { value: 'all' },
        qualifiedName: 'All Mail',
        unreadMessages: 0
      });
    });

  });

  describe('The get fn', function() {

    it('should return a mailbox if found', function() {
      var mailbox = inboxSpecialMailboxes.list()[0];
      var foundMailbox = inboxSpecialMailboxes.get(mailbox.id);

      expect(foundMailbox).to.deep.equal(mailbox);
    });

    it('should return undefined if not found', function() {
      expect(inboxSpecialMailboxes.get('not_found')).to.be.undefined;
    });

  });

});
