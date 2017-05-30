'use strict';

/* global chai: false, sinon: false */

var expect = chai.expect;

describe('The inboxClassificationMessageIndicator component', function() {

  var $compile, $rootScope, jmap, jmapClient, inboxJmapItemService, inboxSelectionService, config, element;

  function compile(html) {
    element = angular.element(html);

    $compile(element)($rootScope);
    $rootScope.$digest();

    return element;
  }

  function newItem(header, mailboxId) {
    return new jmap.Message({}, 'id', 'threadId', [mailboxId || 'inbox'], {
      from: {
        email: 'esn@avat.ar'
      },
      htmlBody: '<html><body><div>Message HTML Body</div></body></html>',
      headers: {
        'X-Classification-Guess': header ? JSON.stringify(header) : null
      }
    });
  }

  afterEach(function() {
    if (element) {
      element.remove();
    }
  });

  beforeEach(function() {
    module('jadeTemplates', 'linagora.esn.unifiedinbox.ml', function($provide) {
      config = {};
      jmapClient = {
        getMailboxes: function(options) {
          var ids = options && options.ids;

          if (ids) {
            return $q.when([
              new jmap.Mailbox(jmapClient, ids[0], ids[0])
            ]);
          }

          return $q.when([
            new jmap.Mailbox(jmapClient, 'inbox', 'inbox', { role: 'inbox' }),
            new jmap.Mailbox(jmapClient, 'mailbox', 'mailbox')
          ]);
        }
      };

      $provide.value('withJmapClient', function(callback) {
        return callback(jmapClient);
      });
      $provide.value('inboxMLConfig', {
        classification: {
          then: function(callback) {
            callback(config);
          }
        }
      });
      $provide.value('inboxJmapItemService', inboxJmapItemService = {
        moveToMailbox: sinon.spy(function() { return $q.when(); }),
        markAsRead: sinon.spy(function() { return $q.when(); })
      });
    });
  });

  beforeEach(inject(function($httpBackend, _$compile_, _$rootScope_, _jmap_, _inboxSelectionService_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    jmap = _jmap_;
    inboxSelectionService = _inboxSelectionService_;

    // So that esnAvatar does not cry
    $httpBackend.expectGET('/api/users?email=esn@avat.ar').respond('');
  }));

  it('should not display the dynamic directive if item has no header', function() {
    $rootScope.item = newItem();

    compile('<inbox-message-list-item />');

    expect(element.find('.indicators .inbox-classification-indicator')).to.have.length(0);
  });

  it('should display the dynamic directive if item has a header, enough confidence but configuration is dsabled', function() {
    config.enabled = false;
    config.minConfidence = 92;

    $rootScope.item = newItem({
      mailboxId: 'mailboxId',
      confidence: 100
    });

    compile('<inbox-message-list-item />');

    expect(element.find('.indicators .inbox-classification-indicator')).to.have.length(0);
  });

  it('should display the dynamic directive if item has a header but not enough confidence and configuration is enabled', function() {
    config.enabled = true;
    config.minConfidence = 92;

    $rootScope.item = newItem({
      mailboxId: 'mailboxId',
      confidence: 80
    });

    compile('<inbox-message-list-item />');

    expect(element.find('.indicators .inbox-classification-indicator')).to.have.length(0);
  });

  it('should display the dynamic directive if item has a header, enough confidence, configuration is enabled but is not in Inbox', function() {
    config.enabled = true;
    config.minConfidence = 92;

    $rootScope.item = newItem({
      mailboxId: 'mailboxId',
      confidence: 100
    }, 'anotherMailboxId');

    compile('<inbox-message-list-item />');

    expect(element.find('.indicators .inbox-classification-indicator')).to.have.length(0);
  });

  it('should display the dynamic directive if item has a header, enough confidence, is in Inbox and configuration is enabled', function() {
    config.enabled = true;
    config.minConfidence = 92;

    $rootScope.item = newItem({
      mailboxId: 'mailboxId',
      confidence: 100
    });

    compile('<inbox-message-list-item />');

    expect(element.find('.indicators .inbox-classification-indicator')).to.have.length(1);
  });

  describe('when clicked', function() {

    beforeEach(function() {
      config.enabled = true;
      config.minConfidence = 90;

      $rootScope.item = newItem({
        mailboxId: 'mailboxId',
        confidence: 100
      });
    });

    it('should unselect the message', function() {
      inboxSelectionService.toggleItemSelection($rootScope.item);

      compile('<inbox-message-list-item />').find('.inbox-classification-indicator').click();

      expect($rootScope.item.selected).to.equal(false);
      expect(inboxSelectionService.isSelecting()).to.equal(false);
    });

    it('should move the message to the target mailbox', function() {
      compile('<inbox-message-list-item />').find('.inbox-classification-indicator').click();

      expect(inboxJmapItemService.moveToMailbox).to.have.been.calledWith($rootScope.item, sinon.match({ id: 'mailboxId' }));
    });

    it('should not mark the message as read, if configuration is disabled', function() {
      compile('<inbox-message-list-item />').find('.inbox-classification-indicator').click();

      expect(inboxJmapItemService.moveToMailbox).to.have.been.calledWith($rootScope.item, sinon.match({ id: 'mailboxId' }));
      expect(inboxJmapItemService.markAsRead).to.have.not.been.calledWith($rootScope.item);
    });

    it('should mark the message as read, if configuration is enabled', function() {
      config.markItemAsReadWhenMoving = true;

      compile('<inbox-message-list-item />').find('.inbox-classification-indicator').click();

      expect(inboxJmapItemService.moveToMailbox).to.have.been.calledWith($rootScope.item, sinon.match({ id: 'mailboxId' }));
      expect(inboxJmapItemService.markAsRead).to.have.been.calledWith($rootScope.item);
    });

  });

});
