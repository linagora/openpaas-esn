'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The linagora.esn.unifiedinbox.ml run block', function() {

  var config = {
    enabled: false
  };

  beforeEach(module('linagora.esn.unifiedinbox.ml', function($provide) {
    $provide.value('inboxMLConfig', {
      classification: {
        then: function(callback) {
          callback(config);
        }
      }
    });
  }));

  it('should not register the mailbox if classification is disabled', function() {
    inject(function(inboxSpecialMailboxes, INBOX_SUGGESTIONS_MAILBOX) {
      expect(inboxSpecialMailboxes.get(INBOX_SUGGESTIONS_MAILBOX.id)).to.equal(undefined);
    });
  });

  it('should not register the mailbox if suggetions folder is disabled', function() {
    config.enabled = true;
    config.showSuggestionsFolder = false;

    inject(function(inboxSpecialMailboxes, INBOX_SUGGESTIONS_MAILBOX) {
      expect(inboxSpecialMailboxes.get(INBOX_SUGGESTIONS_MAILBOX.id)).to.equal(undefined);
    });
  });

  it('should register the mailbox if classification and suggetions folder are enabled', function() {
    config.enabled = true;
    config.showSuggestionsFolder = true;

    inject(function(inboxSpecialMailboxes, INBOX_SUGGESTIONS_MAILBOX) {
      expect(inboxSpecialMailboxes.get(INBOX_SUGGESTIONS_MAILBOX.id)).to.equal(INBOX_SUGGESTIONS_MAILBOX);
    });
  });

});
