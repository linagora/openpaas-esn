'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Mailbox run block', function() {

  var jmap, inboxMailboxesCache;

  beforeEach(module('linagora.esn.unifiedinbox', function($provide) {
    $provide.constant('INBOX_DISPLAY_NAME_SIZE', 10);
  }));

  beforeEach(inject(function(_jmap_, _inboxMailboxesCache_) {
    jmap = _jmap_;
    inboxMailboxesCache = _inboxMailboxesCache_;
  }));

  function newMailbox(id, name, parentId) {
    return new jmap.Mailbox(null, id, name, { parentId: parentId });
  }

  describe('The "displayName" property', function() {

    it('should leverage name property', function() {
      expect(newMailbox(1, 'name1').displayName).to.equal('name1');
    });

    it('should be ellipsised when name.length > INBOX_DISPLAY_NAME_SIZE', function() {
      expect(newMailbox(1, '112233445566778899').displayName).to.equal('1122334455\u2026');
    });

  });

  describe('The "descendants" property', function() {

    it('should return empty array if the cache is empty', function() {
      expect(newMailbox(1, 'name1').descendants).to.deep.equal([]);
    });

    it('should return empty array if the mailbox has no child', function() {
      inboxMailboxesCache.push(newMailbox(2, 'name2', 3));

      expect(newMailbox(1, 'name1').descendants).to.deep.equal([]);
    });

    it('should return an array of descendants in the right order', function() {
      var descendants = [
        newMailbox(2, 'name2', 1),
        newMailbox(3, 'name3', 1),
        newMailbox(4, 'name4', 1)
      ];

      inboxMailboxesCache.push(newMailbox(5, 'name2', 5));
      descendants.forEach(Array.prototype.push.bind(inboxMailboxesCache));

      expect(newMailbox(1, 'name1').descendants).to.deep.equal(descendants);
    });

  });

});
