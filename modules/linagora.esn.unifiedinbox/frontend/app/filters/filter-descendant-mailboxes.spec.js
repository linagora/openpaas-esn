'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The inboxFilterDescendantMailboxes filter', function() {

  var _, filter, cache;

  beforeEach(function() {
    module('linagora.esn.unifiedinbox');
  });

  beforeEach(inject(function(inboxFilterDescendantMailboxesFilter, inboxMailboxesCache, jmap, ___) {
    filter = inboxFilterDescendantMailboxesFilter;
    cache = inboxMailboxesCache;
    _ = ___;

    [
      new jmap.Mailbox(null, '1', '1'),
      new jmap.Mailbox(null, '2', '2', { parentId: '1' }),
      new jmap.Mailbox(null, '3', '3', { parentId: '2' }),
      new jmap.Mailbox(null, '4', '4'),
      new jmap.Mailbox(null, '5', '5', { parentId: '4' })
    ].forEach(function(mailbox) {
      cache.push(mailbox);
    });
  }));

  it('should return mailboxes as-is when not defined', function() {
    expect(filter()).to.equal(undefined);
  });

  it('should return mailboxes as-is when null given', function() {
    expect(filter(null)).to.equal(null);
  });

  it('should return mailboxes as-is when no id is given', function() {
    expect(filter([])).to.deep.equal([]);
  });

  it('should return mailboxes as-is when the mailbox is not found', function() {
    expect(filter(cache, '0')).to.deep.equal(cache);
  });

  it('should filter out the mailbox and its descendants', function() {
    expect(_.map(filter(cache, '1'), 'id')).to.deep.equal(['4', '5']);
  });

  it('should filter out the mailbox only when there is no descendants', function() {
    expect(_.map(filter(cache, '5'), 'id')).to.deep.equal(['1', '2', '3', '4']);
  });

  it('should filter out the mailbox only when there is descendants but filterOnlyParentMailbox=true', function() {
    expect(_.map(filter(cache, '1', true), 'id')).to.deep.equal(['2', '3', '4', '5']);
  });

});
