'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Thread run block', function() {
  var jmap, _;

  beforeEach(function() {
    module('linagora.esn.unifiedinbox');
  });

  beforeEach(inject(function(_jmap_, ___) {
    jmap = _jmap_;
    _ = ___;
  }));

  function newThread(emails) {
    var thread = new jmap.Thread(null, 'threadId', { messageIds: _(emails).pluck('id').value() });

    thread.emails = emails;

    return thread;
  }

  function newMessage(mailboxIds, options) {
    return new jmap.Message(null, 'id', 'threadId', mailboxIds, options);
  }

  it('should have id, mailboxIds, subject, date, hasAttachment and emails properties', function() {
    var emails = [
          newMessage(['1'], { subject: 'firstSubject' }),
          newMessage(['1', '2'], { subject: 'secondSubject' }),
          newMessage(['2', '3', '4'], { subject: 'secondSubject', date: '2017-01-01T00:00:00Z', hasAttachment: false }),
          newMessage(['3'], { subject: 'subject', date: '2017-01-02T00:00:00Z', hasAttachment: true })
        ],
        thread = newThread(emails);

    expect(thread).to.shallowDeepEqual({
      id: 'threadId',
      mailboxIds: ['1', '2', '3', '4'],
      subject: 'subject',
      emails: emails,
      date: new Date('2017-01-02T00:00:00Z'),
      hasAttachment: true
    });
  });

  it('should have mailboxIds set to an empty array when no emails are given', function() {
    expect(newThread().mailboxIds).to.deep.equal([]);
  });

  it('should have subject set to an empty String when no emails are given', function() {
    expect(newThread().subject).to.equal('');
  });

  it('should have isUnread=true if at least one email is unread', function() {
    expect(newThread([
      newMessage(['inbox'], { isUnread: true }),
      newMessage(['inbox'], { isUnread: false })
    ]).isUnread).to.equal(true);
  });

  it('should have isUnread=true if all emails are unread', function() {
    expect(newThread([
      newMessage(['inbox'], { isUnread: true }),
      newMessage(['inbox'], { isUnread: true }),
      newMessage(['inbox'], { isUnread: true })
    ]).isUnread).to.equal(true);
  });

  it('should have isUnread=false if all emails are read', function() {
    expect(newThread([
      newMessage(['inbox'], { isUnread: false }),
      newMessage(['inbox'], { isUnread: false })
    ]).isUnread).to.equal(false);
  });

  it('should have isFlagged=true if at least one email is flagged', function() {
    expect(newThread([
      newMessage(['inbox'], { isFlagged: true }),
      newMessage(['inbox'], { isFlagged: false })
    ]).isFlagged).to.equal(true);
  });

  it('should have isFlagged=true if all emails are flagged', function() {
    expect(newThread([
      newMessage(['inbox'], { isFlagged: true }),
      newMessage(['inbox'], { isFlagged: true }),
      newMessage(['inbox'], { isFlagged: true })
    ]).isFlagged).to.equal(true);
  });

  it('should have isFlagged=false if all emails are not flagged', function() {
    expect(newThread([
      newMessage(['inbox'], { isFlagged: false }),
      newMessage(['inbox'], { isFlagged: false })
    ]).isFlagged).to.equal(false);
  });

  it('should have hasAttachment=false when no email', function() {
    expect(newThread([]).hasAttachment).to.equal(false);
  });

  it('should have hasAttachment=false when the last email has no attachment', function() {
    expect(newThread([
      newMessage(['inbox'], { hasAttachment: true }),
      newMessage(['inbox'], { hasAttachment: false })
    ]).hasAttachment).to.equal(false);
  });

  it('should have hasAttachment=true when the last email has attachment', function() {
    expect(newThread([
      newMessage(['inbox'], { hasAttachment: true }),
      newMessage(['inbox'], { hasAttachment: true })
    ]).hasAttachment).to.equal(true);
  });

  it('should return a Selectable', function() {
    expect(newThread([]).selectable).to.equal(true);
  });

});
