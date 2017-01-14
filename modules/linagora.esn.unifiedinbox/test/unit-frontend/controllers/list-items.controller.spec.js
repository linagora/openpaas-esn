'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The linagora.esn.unifiedinbox listItemsController', function() {

  // Injected
  var scope, $controller, jmap, inboxHostedMailMessagesProvider, inboxHostedMailThreadsProvider, inboxSelectionService,
      ELEMENTS_PER_REQUEST, JMAP_GET_MESSAGES_LIST;
  // Mocked
  var $stateParams, jmapClient, resolvedProvider;

  beforeEach(module('linagora.esn.unifiedinbox', function($provide) {
    $stateParams = {
      mailbox: 'chosenMailbox',
      emailId: '4'
    };
    jmapClient = {
      getMailboxes: function() {
        return $q.when([{role: jmap.MailboxRole.UNKNOWN, name: 'a name', id: 'chosenMailbox'}]);
      },
      getMessageList: function() {
        return $q.when({
          getMessages: function() { return $q.when([]); },
          getThreads: function() { return $q.when([]); }
        });
      }
    };

    $provide.value('mailboxIdsFilter', { resolved: 'mailboxIdsFilter' });
    $provide.value('$stateParams', $stateParams);
    $provide.value('withJmapClient', function(callback) {
      return callback(jmapClient);
    });
    $provide.service('hostedMailProvider', function() {
      return resolvedProvider;
    });
    $provide.constant('ELEMENTS_PER_PAGE', 2);
  }));

  beforeEach(inject(function(_$rootScope_, _$controller_, _jmap_,
       _inboxHostedMailMessagesProvider_, _inboxHostedMailThreadsProvider_, _inboxSelectionService_,
       _ELEMENTS_PER_REQUEST_, _JMAP_GET_MESSAGES_LIST_) {

    scope = _$rootScope_.$new();
    $controller = _$controller_;
    jmap = _jmap_;
    inboxHostedMailMessagesProvider = _inboxHostedMailMessagesProvider_;
    inboxHostedMailThreadsProvider = _inboxHostedMailThreadsProvider_;
    inboxSelectionService = _inboxSelectionService_;
    resolvedProvider = inboxHostedMailMessagesProvider;

    ELEMENTS_PER_REQUEST = _ELEMENTS_PER_REQUEST_;
    JMAP_GET_MESSAGES_LIST = _JMAP_GET_MESSAGES_LIST_;
  }));

  function initController(ctrl) {
    var controller = $controller(ctrl, { $scope: scope });

    scope.$digest();

    return controller;
  }

  it('should set $scope.mailbox from the \'mailbox\' route parameter', function() {
    initController('listItemsController');
    expect(scope.mailbox.id).to.equal('chosenMailbox');
  });

  it('should reset selection', function() {
    inboxSelectionService.toggleItemSelection({});

    initController('listItemsController');

    expect(inboxSelectionService.isSelecting()).to.equal(false);
  });

  it('should call jmapClient.getMailboxes with the expected mailbox id and properties', function(done) {
    jmapClient.getMailboxes = function(options) {
      expect(options).to.deep.equal({ ids: ['chosenMailbox'] });

      done();
    };

    initController('listItemsController');
  });

  it('should call jmapClient.getMailboxes then find the mailbox role and name', function() {
    jmapClient.getMailboxes = function() {
      return $q.when([{ id: 'chosenMailbox', role: 'expected role', name: 'expected name' }]);
    };

    initController('listItemsController');

    expect(scope.mailbox.role).to.equal('expected role');
    expect(scope.mailbox.name).to.equal('expected name');
  });

  it('should build an EmailGroupingTool with the list of messages, and assign it to scope.groupedEmails', function(done) {
    initController('listItemsController');

    scope.$watch('groupedElements', function(before, after) {
      expect(after).to.be.a('Array');

      done();
    });
    scope.$digest();
  });

  describe('The loadMoreElements function', function() {

    function loadMoreElements() {
      initController('listItemsController');

      var promise = scope.loadMoreElements();

      scope.$digest();

      return promise;
    }

    describe('When the provider is the message one', function() {

      beforeEach(function() {
        resolvedProvider = inboxHostedMailMessagesProvider;
      });

      it('should call jmapClient.getMessageList with correct arguments', function(done) {
        jmapClient.getMessageList = function(options) {
          expect(options).to.deep.equal({
            filter: { resolved: 'mailboxIdsFilter' },
            sort: ['date desc'],
            collapseThreads: false,
            fetchMessages: false,
            position: 0,
            limit: ELEMENTS_PER_REQUEST
          });

          done();
        };

        loadMoreElements();
      });

      it('should call jmapClient.getMessageList then getMessages', function() {
        var messageListResult = {
          messageIds: [1, 2],
          getMessages: sinon.spy(function(data) {
            expect(data).to.deep.equal({
              properties: JMAP_GET_MESSAGES_LIST
            });

            return [];
          })
        };

        jmapClient.getMessageList = function() {
          return $q.when(messageListResult);
        };

        loadMoreElements();

        expect(messageListResult.getMessages).to.have.been.called;
      });

      it('should not call jmapClient.getMessageList when windowing is done', function(done) {
        jmapClient.getMessageList = sinon.spy();
        scope.infiniteScrollCompleted = true;

        loadMoreElements().then(null, function() {
          expect(jmapClient.getMessageList).to.not.have.been.called;

          done();
        });
        scope.$digest();
      });

      it('should reject, set scope.infiniteScrollCompleted=true when windowing is done', function(done) {
        var messageList = {
          messageIds: [1], // Only one result, so < limit
          getMessages: function() {
            return [];
          }
        };

        jmapClient.getMessageList = function() {
          return $q.when(messageList);
        };

        loadMoreElements().then(null, function() {
          expect(scope.infiniteScrollCompleted).to.equal(true);

          done();
        });
        scope.$digest();
      });

    });

    describe('When the provider is the thread one', function() {

      beforeEach(function() {
        resolvedProvider = inboxHostedMailThreadsProvider;
      });

      it('should call jmapClient.getMessageList with correct arguments', function(done) {
        jmapClient.getMessageList = function(options) {
          expect(options).to.deep.equal({
            filter: { resolved: 'mailboxIdsFilter' },
            collapseThreads: true,
            fetchThreads: false,
            fetchMessages: false,
            sort: ['date desc'],
            position: 0,
            limit: ELEMENTS_PER_REQUEST
          });

          done();
        };

        loadMoreElements();
      });

      it('should call jmapClient.getMessageList then getMessages and getThreads', function() {
        var messageListResult = {
          threadIds: [1, 2],
          getMessages: sinon.spy(function(data) {
            expect(data).to.deep.equal({
              properties: JMAP_GET_MESSAGES_LIST
            });

            return [];
          }),
          getThreads: sinon.spy(function(data) {
            expect(data).to.deep.equal({
              fetchMessages: false
            });

            return [];
          })
        };

        jmapClient.getMessageList = function() {
          return $q.when(messageListResult);
        };

        loadMoreElements();

        expect(messageListResult.getMessages).to.have.been.called;
        expect(messageListResult.getThreads).to.have.been.called;
      });

      it('should add email and date for each thread', function() {
        var thread1 = {id: 'thread1', messageIds: ['msg1']},
            thread2 = {id: 'thread2', messageIds: ['msg2']};
        var messageListResult = {
          threadIds: [1, 2],
          getMessages: sinon.spy(function() { return [{id: 'msg1', threadId: 'thread1', date: '2016-03-21T10:16:22.628Z'}, {id: 'msg2', threadId: 'thread2', date: '2016-03-22T10:16:22.628Z'}];}),
          getThreads: sinon.spy(function() { return [thread1, thread2];})
        };

        jmapClient.getMessageList = function() {
          return $q.when(messageListResult);
        };

        loadMoreElements();

        expect(messageListResult.getMessages).to.have.been.called;
        expect(messageListResult.getThreads).to.have.been.called;

        expect(thread1.email).to.shallowDeepEqual({id: 'msg1', threadId: 'thread1', date: '2016-03-21T10:16:22.628Z'});
        expect(thread1.date).to.equalTime(new Date('2016-03-21T10:16:22.628Z'));

        expect(thread2.email).to.shallowDeepEqual({id: 'msg2', threadId: 'thread2', date: '2016-03-22T10:16:22.628Z'});
        expect(thread2.date).to.equalTime(new Date('2016-03-22T10:16:22.628Z'));
      });

      it('should not call jmapClient.getMessageList when windowing is done', function(done) {
        jmapClient.getMessageList = sinon.spy();
        scope.infiniteScrollCompleted = true;

        loadMoreElements().then(null, function() {
          expect(jmapClient.getMessageList).to.not.have.been.called;

          done();
        });
        scope.$digest();
      });

      it('should reject, set scope.infiniteScrollCompleted=true when windowing is done', function(done) {
        var messageList = {
          threadIds: [1], // Only one result, so < limit
          getMessages: function() {return [];},
          getThreads: function() {return [];}
        };

        jmapClient.getMessageList = function() {
          return $q.when(messageList);
        };

        loadMoreElements().then(null, function() {
          expect(scope.infiniteScrollCompleted).to.equal(true);

          done();
        });
        scope.$digest();
      });

    });

  });

});
