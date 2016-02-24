'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The linagora.esn.unifiedinbox module controllers', function() {

  var $stateParams, $rootScope, scope, $controller,
      jmapClient, jmap, notificationFactory, draftService, Offline = {},
      emailSendingService, Composition, newComposerService = {}, headerService, $state, $modal,
      mailboxesService, inboxEmailService, _, windowMock, fileUploadMock, jmapConfig;
  var JMAP_GET_MESSAGES_VIEW, JMAP_GET_MESSAGES_LIST, ELEMENTS_PER_PAGE,
      DEFAULT_FILE_TYPE, DEFAULT_MAX_SIZE_UPLOAD;

  beforeEach(function() {
    $stateParams = {
      mailbox: 'chosenMailbox',
      emailId: '4'
    };
    notificationFactory = {
      weakSuccess: sinon.spy(),
      weakError: sinon.spy(),
      strongInfo: function() { return { close: sinon.spy() }; }
    };
    headerService = {
      subHeader: {
        setInjection: angular.noop,
        resetInjections: angular.noop
      }
    };
    $state = {
      go: sinon.spy()
    };
    windowMock = {
      open: sinon.spy()
    };
    $modal = sinon.spy();

    angular.mock.module('esn.core');
    angular.mock.module('esn.notification');

    module('linagora.esn.unifiedinbox', function($provide) {
      jmapClient = {};
      jmapConfig = {
        uploadUrl: 'http://jmap',
        maxSizeUpload: DEFAULT_MAX_SIZE_UPLOAD
      };
      fileUploadMock = {
        addFile: function() {
          return {
            defer: $q.defer()
          };
        }
      };

      $provide.value('withJmapClient', function(callback) {
        return callback(jmapClient, jmapConfig);
      });
      $provide.decorator('$window', function($delegate) {
        return angular.extend($delegate, windowMock);
      });
      $provide.value('$stateParams', $stateParams);
      $provide.value('notificationFactory', notificationFactory);
      $provide.value('Offline', Offline);
      $provide.value('$modal', $modal);
      $provide.value('draftService', draftService = {});
      $provide.value('newComposerService', newComposerService);
      $provide.value('headerService', headerService);
      $provide.value('$state', $state);
      $provide.constant('ELEMENTS_PER_PAGE', 2);
      $provide.value('fileUploadService', {
        get: function() {
          return fileUploadMock;
        }
      });
    });
  });

  beforeEach(angular.mock.inject(function(_$rootScope_, _$controller_, _jmap_, _$timeout_, _emailSendingService_,
                                          _Composition_, _mailboxesService_, _inboxEmailService_, ___, _JMAP_GET_MESSAGES_VIEW_,
                                          _JMAP_GET_MESSAGES_LIST_, _ELEMENTS_PER_PAGE_, _DEFAULT_FILE_TYPE_,
                                          _DEFAULT_MAX_SIZE_UPLOAD_) {
    $rootScope = _$rootScope_;
    $controller = _$controller_;
    jmap = _jmap_;
    emailSendingService = _emailSendingService_;
    Composition = _Composition_;
    mailboxesService = _mailboxesService_;
    inboxEmailService = _inboxEmailService_;
    _ = ___;
    JMAP_GET_MESSAGES_VIEW = _JMAP_GET_MESSAGES_VIEW_;
    JMAP_GET_MESSAGES_LIST = _JMAP_GET_MESSAGES_LIST_;
    ELEMENTS_PER_PAGE = _ELEMENTS_PER_PAGE_;
    DEFAULT_FILE_TYPE = _DEFAULT_FILE_TYPE_;
    DEFAULT_MAX_SIZE_UPLOAD = _DEFAULT_MAX_SIZE_UPLOAD_;

    scope = $rootScope.$new();
  }));

  function initController(ctrl) {
    var controller = $controller(ctrl, {
      $scope: scope
    });

    scope.$digest();

    return controller;
  }

  describe('The composerController', function() {

    beforeEach(inject(function() {
      draftService.startDraft = sinon.spy();
      headerService.subHeader.setVisibleMD = angular.noop;

      scope.hide = sinon.spy();
      scope.disableSendButton = sinon.spy();
      scope.enableSendButton = sinon.spy();
      scope.email = {to: []};
    }));

    function initCtrl(email) {
      var ctrl = initController('composerController');
      ctrl.initCtrl(email);
      return ctrl;
    }

    it('should start the draft at init time', function() {
      initCtrl({obj: 'expected'});
      expect(draftService.startDraft).to.have.been.calledOnce;
    });

    it('should save the draft when saveDraft is called', function() {
      Composition.prototype.saveDraft = sinon.spy();

      initCtrl({obj: 'expected'}).saveDraft();

      expect(Composition.prototype.saveDraft).to.have.been.calledOnce;
    });

    it('should not send an email when canBeSentOrNotify returns false', function() {
      Composition.prototype.canBeSentOrNotify = sinon.stub().returns(false);
      initCtrl({
        to: [],
        cc: [],
        bcc: []
      });

      scope.send();

      expect(scope.hide).to.have.not.been.called;
      expect(scope.disableSendButton).to.have.been.calledOnce;
      expect(scope.enableSendButton).to.have.been.calledOnce;
    });

    it('should send an email when canBeSentOrNotify returns true', function() {
      Composition.prototype.canBeSentOrNotify = sinon.stub().returns(true);
      Composition.prototype.send = sinon.spy();
      initCtrl({
        to: [{displayName: '1', email: '1@linagora.com'}],
        cc: [],
        bcc: []
      });

      scope.send();

      expect(scope.hide).to.have.been.calledOnce;
      expect(scope.disableSendButton).to.have.been.calledOnce;
      expect(Composition.prototype.send).to.have.been.calledOnce;
    });

    it('should initialize the controller when a Composition instance is given in state params', function() {
      $stateParams.composition = { getEmail: angular.noop };
      initController('composerController');

      expect(scope.composition).to.deep.equal($stateParams.composition);
    });

    it('should initialize the controller when an email is given in state params', function() {
      $stateParams.email = { to: [] };
      initController('composerController');

      expect(scope.composition).to.be.an.instanceof(Composition);
      expect(scope.email).to.be.a('object');
    });

    describe('The onAttachmentsSelect function', function() {

      it('should do nothing if no files are given', function() {
        initController('composerController').onAttachmentsSelect();

        expect(scope.email.attachments).to.equal(undefined);
      });

      it('should do nothing if files is zerolength', function() {
        initController('composerController').onAttachmentsSelect([]);

        expect(scope.email.attachments).to.equal(undefined);
      });

      it('should put the attachment in the scope, with an unknown blobId', function() {
        initController('composerController').onAttachmentsSelect([{ name: 'name', size: 1, type: 'type' }]);

        expect(scope.email.attachments[0]).to.shallowDeepEqual({
          blobId: 'unknownBlobId',
          name: 'name',
          size: 1,
          type: 'type',
          status: 'uploading'
        });
      });

      it('should put the attachment in the scope, with a default file type', function() {
        initController('composerController').onAttachmentsSelect([{ name: 'name', size: 1 }]);

        expect(scope.email.attachments[0]).to.shallowDeepEqual({
          blobId: 'unknownBlobId',
          name: 'name',
          size: 1,
          type: DEFAULT_FILE_TYPE
        });
      });

      it('should put the attachment in the scope, if the file size is exactly the limit', function() {
        initController('composerController').onAttachmentsSelect([{ name: 'name', size: DEFAULT_MAX_SIZE_UPLOAD }]);

        expect(scope.email.attachments.length).to.equal(1);
      });

      it('should set the blobId when upload succeeds', function() {
        fileUploadMock = {
          addFile: function() {
            var defer = $q.defer();

            defer.resolve({
              response: {
                blobId: '1234'
              }
            });

            return {
              defer: defer
            };
          }
        };

        initController('composerController').onAttachmentsSelect([{ name: 'name', size: 1 }]);
        $rootScope.$digest();

        expect(scope.email.attachments[0]).to.shallowDeepEqual({
          blobId: '1234',
          name: 'name',
          size: 1,
          type: DEFAULT_FILE_TYPE,
          status: 'uploaded'
        });
      });

      it('should set attachment.error if upload fails', function() {
        fileUploadMock = {
          addFile: function() {
            var defer = $q.defer();

            defer.reject('WTF');

            return {
              defer: defer
            };
          }
        };

        initController('composerController').onAttachmentsSelect([{ name: 'name', size: 1 }]);
        $rootScope.$digest();

        expect(scope.email.attachments[0]).to.shallowDeepEqual({
          error: 'WTF',
          status: 'error'
        });
      });

      it('should notify and not add the attachment if file is larger that the default limit', function() {
        initController('composerController').onAttachmentsSelect([{ name: 'name', size: DEFAULT_MAX_SIZE_UPLOAD + 1 }]);

        expect(notificationFactory.weakError).to.have.been.calledWith('', 'File name ignored as its size exceeds the 20MB limit');
        expect(scope.email.attachments).to.deep.equal([]);
      });

      it('should notify and not add the attachment if file is larger that a configured limit', function() {
        jmapConfig.maxSizeUpload = 1024 * 1024; // 1MB
        initController('composerController').onAttachmentsSelect([{ name: 'name', size: 1024 * 1024 * 2 }]);

        expect(notificationFactory.weakError).to.have.been.calledWith('', 'File name ignored as its size exceeds the 1MB limit');
        expect(scope.email.attachments).to.deep.equal([]);
      });

      describe('The attachment.startUpload function', function() {

        it('should restore upload and status properties of the attachment', function() {
          fileUploadMock = {
            addFile: function() {
              var defer = $q.defer();

              defer.reject('WTF');

              return {
                defer: defer
              };
            }
          };

          initController('composerController').onAttachmentsSelect([{ name: 'name', size: 1 }]);
          $rootScope.$digest();

          var attachment = scope.email.attachments[0];

          attachment.startUpload();

          expect(attachment.upload.progress).to.equal(0);
          expect(attachment.status).to.equal('uploading');
        });

      });

    });

    describe('The removeAttachment function', function() {

      it('should cancel an ongoing upload', function(done) {
        var attachment = { upload: { cancel: done } };
        scope.email.attachments = [attachment];

        initController('composerController').removeAttachment(attachment);
      });

      it('should remove the attachment from the email', function() {
        var attachment = { blobId: 'willBeRemoved', upload: { cancel: angular.noop } };
        scope.email.attachments = [attachment, { blobId: '1' }];

        initController('composerController').removeAttachment(attachment);

        expect(scope.email.attachments).to.deep.equal([{ blobId: '1' }]);
      });

    });

  });

  describe('The listEmailsController', function() {

    var jmapMessage;

    beforeEach(function() {
      jmapMessage = new jmap.Message(jmapClient, 'messageId1', 'threadId1', [$stateParams.mailbox], {
        isFlagged: false
      });
      jmapMessage.setIsFlagged = sinon.stub().returns($q.when());

      jmapClient.getMailboxes = function() {
        return $q.when([{role: jmap.MailboxRole.UNKNOWN, name: 'a name', id: 'chosenMailbox'}]);
      };
      jmapClient.getMessageList = function() {
        return $q.when({ getMessages: function() { return $q.when([]); } });
      };
    });

    it('should set $scope.mailbox from the \'mailbox\' route parameter', function() {
      initController('listEmailsController');
      expect(scope.mailbox.id).to.equal('chosenMailbox');
    });

    it('should call jmapClient.getMailboxes with the expected mailbox id and properties', function(done) {
      jmapClient.getMailboxes = function(options) {
        expect(options).to.deep.equal({ids: ['chosenMailbox']});
        done();
      };

      initController('listEmailsController');
    });

    it('should call jmapClient.getMailboxes then find the mailbox role and name', function() {
      jmapClient.getMailboxes = function() {
        return $q.when([{role: 'expected role', name: 'expected name'}]);
      };

      initController('listEmailsController');

      expect(scope.mailbox.role).to.equal('expected role');
      expect(scope.mailbox.name).to.equal('expected name');
    });

    it('should call jmapClient.getMailboxes then jmapClient.getMessageList', function(done) {
      jmapClient.getMailboxes = sinon.stub().returns($q.when([{}]));
      jmapClient.getMessageList = function() {
        done();
      };

      initController('listEmailsController');
    });

    it('should call jmapClient.getMessageList with correct arguments', function(done) {
      jmapClient.getMessageList = function(options) {
        expect(options).to.deep.equal({
          filter: {
            inMailboxes: ['chosenMailbox']
          },
          collapseThreads: false,
          fetchMessages: false,
          position: 0,
          limit: 100
        });

        done();
      };

      initController('listEmailsController');
    });

    it('should call jmapClient.getMessageList then getMessages with expected options', function(done) {
      var messageListResult = {
        getMessages: function(options) {
          expect(options).to.deep.equal({
            properties: JMAP_GET_MESSAGES_LIST
          });

          done();
        }
      };

      jmapClient.getMessageList = function() {
        return $q.when(messageListResult);
      };

      initController('listEmailsController');
    });

    it('should build an EmailGroupingTool with the list of messages, and assign it to scope.groupedEmails', function(done) {
      initController('listEmailsController');

      scope.$watch('groupedEmails', function(before, after) {
        expect(after).to.be.a('Array');

        done();
      });
      scope.$digest();
    });

    it('should display the list-emails-subheader mobile header', function() {
      headerService.subHeader.setInjection = sinon.spy();

      initController('listEmailsController');

      expect(headerService.subHeader.setInjection).to.have.been.calledWith('list-emails-subheader', sinon.match.any);
    });

    describe('openEmail fn', function() {

      var newComposerService;

      beforeEach(angular.mock.inject(function(_newComposerService_) {
        newComposerService = _newComposerService_;
      }));

      it('should call newComposerService.openDraft if mailbox has the draft role', function() {
        newComposerService.openDraft = sinon.spy();

        initController('listEmailsController').openEmail({ id: 'id', isDraft: true });

        expect(newComposerService.openDraft).to.have.been.calledWith('id');
      });

      it('should change state if mailbox has not the draft role', function() {
        $state.go = sinon.spy();

        initController('listEmailsController').openEmail({id: 'expectedId'});

        expect($state.go).to.have.been.calledWith('unifiedinbox.messages.message', { emailId: 'expectedId', mailbox: 'chosenMailbox' });
      });

    });

  });

  describe('The viewEmailController', function() {

    var jmapMessage;

    beforeEach(function() {
      jmapMessage = new jmap.Message(jmapClient, 'messageId1', 'threadId1', [$stateParams.mailbox], {
        isUnread: false
      });
      jmapMessage.setIsUnread = sinon.stub().returns($q.when());

      jmapClient.getMessages = function() { return $q.when([jmapMessage]); };
    });

    it('should set $scope.mailbox and $scope.emailId from the route parameters', function() {
      initController('viewEmailController');

      expect(scope.mailbox).to.equal('chosenMailbox');
      expect(scope.emailId).to.equal('4');
    });

    it('should call jmapClient.getMessages with correct arguments', function(done) {
      jmapClient.getMessages = function(options) {
        expect(options).to.deep.equal({
          ids: ['4'],
          properties: JMAP_GET_MESSAGES_VIEW
        });

        done();
      };

      initController('viewEmailController');
    });

    it('should assign the returned message to $scope.email', function(done) {
      jmapClient.getMessages = function() {
        return $q.when([{ isUnread: false, property: 'property', mailboxIds: [] }]);
      };

      initController('viewEmailController');

      scope.$watch('email', function(before, after) {
        expect(after).to.deep.equal({ isUnread: false, property: 'property', mailboxIds: [] });

        done();
      });

      scope.$digest();
    });

    it('should mark the email as read once it\'s loaded', function() {
      jmapMessage.isUnread = true;

      initController('viewEmailController');

      expect(jmapMessage.setIsUnread).to.have.been.calledWith(false);
      expect(jmapMessage.isUnread).to.equal(false);
    });

    it('should display the view-email-subheader mobile header', function() {
      headerService.subHeader.setInjection = sinon.spy();

      initController('viewEmailController');

      expect(headerService.subHeader.setInjection).to.have.been.calledWith('view-email-subheader', sinon.match.any);
    });

  });

  describe('The viewThreadController', function() {

    var jmapThread,
        threadId = 'thread1',
        threadMessages;

    function mockGetThreadAndMessages(messages) {
      jmapThread.getMessages = function() {
        return $q.when(threadMessages = messages);
      };
    }

    beforeEach(function() {
      jmapThread = new jmap.Thread(jmapClient, threadId);
      jmapThread.setIsUnread = sinon.stub().returns($q.when());
      mockGetThreadAndMessages([{
        id: 'email1',
        mailboxIds: [threadId],
        subject: 'email subject 1',
        isUnread: false
      }, {
        id: 'email2',
        mailboxIds: [threadId],
        subject: 'email subject 2',
        isUnread: true
      }]);

      jmapClient.getThreads = function() {
        return $q.when([jmapThread]);
      };
    });

    it('should display the view-thread-subheader mobile header', function() {
      headerService.subHeader.setInjection = sinon.spy();

      initController('viewThreadController');

      expect(headerService.subHeader.setInjection).to.have.been.calledWith('view-thread-subheader', sinon.match.any);
    });

    it('should search for message ids of the given thread id', function(done) {
      $stateParams.threadId = 'expectedThreadId';
      jmapClient.getThreads = function(options) {
        expect(options).to.deep.equal({ids: ['expectedThreadId'], fetchMessages: false});
        done();
      };

      initController('viewThreadController');
    });

    it('should search messages of the getThreads reply', function(done) {
      jmapClient.getThreads = function() {
        return $q.when([{
          getMessages: function(data) {
            expect(data).to.shallowDeepEqual({
              properties: JMAP_GET_MESSAGES_VIEW
            });

            done();
          }
        }]);
      };

      initController('viewThreadController');
    });

    it('should assign thread.emails from the getMessages reply', function() {
      jmapClient.getThreads = function() {
        return $q.when([{
          getMessages: function() {
            return [{id: 'email1', subject: 'thread subject'}];
          }
        }]);
      };

      initController('viewThreadController');

      expect(scope.thread.emails).to.shallowDeepEqual([
        {id: 'email1', subject: 'thread subject'}
      ]);
    });

    it('should assign thread.subject from the first message', function() {
      jmapClient.getThreads = function() {
        return $q.when([{
          getMessages: function() {
            return [
              {id: 'email1', subject: 'thread subject1'},
              {id: 'email2', subject: 'thread subject2'},
              {id: 'email3', subject: 'thread subject3'}
            ];
          }
        }]);
      };

      initController('viewThreadController');

      expect(scope.thread.subject).to.equal('thread subject1');
    });

    it('should expose a "reply" fn bound to the last email', function() {
      inboxEmailService.reply = sinon.spy();

      initController('viewThreadController').reply();

      expect(inboxEmailService.reply).to.have.been.calledWith(threadMessages[1]);
    });

    it('should expose a "reply" fn bound to the last email', function() {
      inboxEmailService.replyAll = sinon.spy();

      initController('viewThreadController').replyAll();

      expect(inboxEmailService.replyAll).to.have.been.calledWith(threadMessages[1]);
    });

    it('should expose a "forward" fn bound to the last email', function() {
      inboxEmailService.forward = sinon.spy();

      initController('viewThreadController').forward();

      expect(inboxEmailService.forward).to.have.been.calledWith(threadMessages[1]);
    });

    it('should mark the thread as read once it\'s loaded', function() {
      initController('viewThreadController');

      expect(scope.thread.setIsUnread).to.have.been.calledWith(false);
      expect(scope.thread.emails).to.shallowDeepEqual([{
        id: 'email1',
        mailboxIds: [threadId],
        subject: 'email subject 1',
        isUnread: false
      }, {
        id: 'email2',
        mailboxIds: [threadId],
        subject: 'email subject 2',
        isUnread: false
      }]);
    });

    it('should set isCollapsed=true for all read emails, when there is at least one unread', function() {
      mockGetThreadAndMessages([
        {id: 'email1', mailboxIds: [threadId], subject: 'thread subject1', isUnread: false },
        {id: 'email2', mailboxIds: [threadId], subject: 'thread subject2', isUnread: true },
        {id: 'email3', mailboxIds: [threadId], subject: 'thread subject3', isUnread: false }
      ]);

      initController('viewThreadController');

      expect(_.pluck(scope.thread.emails, 'isCollapsed')).to.deep.equal([true, false, true]);
    });

    it('should set isCollapsed=true for all read emails except the last one, when all emails are read', function() {
      mockGetThreadAndMessages([
        {id: 'email1', mailboxIds: [threadId], subject: 'thread subject1', isUnread: false },
        {id: 'email2', mailboxIds: [threadId], subject: 'thread subject2', isUnread: false },
        {id: 'email3', mailboxIds: [threadId], subject: 'thread subject3', isUnread: false }
      ]);

      initController('viewThreadController');

      expect(_.pluck(scope.thread.emails, 'isCollapsed')).to.deep.equal([true, true, false]);
    });

    it('should set isCollapsed=false for all emails except, when all emails are unread', function() {
      mockGetThreadAndMessages([
        {id: 'email1', mailboxIds: [threadId], subject: 'thread subject1', isUnread: true },
        {id: 'email2', mailboxIds: [threadId], subject: 'thread subject2', isUnread: true },
        {id: 'email3', mailboxIds: [threadId], subject: 'thread subject3', isUnread: true }
      ]);

      initController('viewThreadController');

      expect(_.pluck(scope.thread.emails, 'isCollapsed')).to.deep.equal([false, false, false]);
    });

  });

  describe('The listThreadsController', function() {

    beforeEach(function() {
      jmapClient.getMailboxes = function() {
        return $q.when([{name: 'a name', id: 'chosenMailbox'}]);
      };
      jmapClient.getMessageList = function() {
        return $q.when({
          getMessages: function() {return [];},
          getThreads: function() {return [];}
        });
      };
    });

    it('should set $scope.mailbox to the mailbox parameter passed by state', function() {
      initController('listThreadsController');
      expect(scope.mailbox.id).to.equal('chosenMailbox');
    });

    it('should call jmapClient.getMailboxes with the expected mailbox id and properties', function(done) {
      jmapClient.getMailboxes = function(options) {
        expect(options).to.deep.equal({ids: ['chosenMailbox']});
        done();
      };

      initController('listThreadsController');
    });

    it('should call jmapClient.getMailboxes then find the mailbox name', function() {
      initController('listThreadsController');

      expect(scope.mailbox.name).to.equal('a name');
    });

    it('should build an EmailGroupingTool with the list of threads, and assign it to scope.groupedThreads', function(done) {
      initController('listThreadsController');

      scope.$watch('groupedThreads', function(before, after) {
        expect(after).to.be.a('Array');

        done();
      });
      scope.$digest();
    });

    it('should display the list-emails-subheader mobile header', function() {
      headerService.subHeader.setInjection = sinon.spy();

      initController('listThreadsController');

      expect(headerService.subHeader.setInjection).to.have.been.calledWith('list-emails-subheader', sinon.match.any);
    });

    describe('The openThread function', function() {

      it('should change the state to the thread view if thread.email is not a draft', function() {
        initController('listThreadsController').openThread({ id: 'expected thread id', email: { isDraft: false } });

        expect($state.go).to.have.been.calledWith('unifiedinbox.threads.thread', {
          mailbox: 'chosenMailbox',
          threadId: 'expected thread id'
        });
      });

      it('should open the composer if thread.email is a draft', function() {
        newComposerService.openDraft = sinon.spy();

        initController('listThreadsController').openThread({ id: 'expected thread id', email: { id: 'id', isDraft: true } });

        expect(newComposerService.openDraft).to.have.been.calledWith('id');
      });

    });

    describe('The loadMoreElements function', function() {

      function loadMoreElements() {
        initController('listThreadsController');

        var promise = scope.loadMoreElements();
        scope.$digest();

        return promise;
      }

      it('should call jmapClient.getMessageList with correct arguments', function(done) {
        jmapClient.getMessageList = function(options) {
          expect(options).to.deep.equal({
            filter: {
              inMailboxes: ['chosenMailbox']
            },
            collapseThreads: true,
            fetchThreads: false,
            fetchMessages: false,
            sort: ['date desc'],
            position: 0,
            limit: ELEMENTS_PER_PAGE
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
          getMessages: sinon.spy(function() { return [{id: 'msg1', threadId: 'thread1', date: '10:00:00'}, {id: 'msg2', threadId: 'thread2', date: '12:00:00'}];}),
          getThreads: sinon.spy(function() { return [thread1, thread2];})
        };

        jmapClient.getMessageList = function() {
          return $q.when(messageListResult);
        };

        loadMoreElements();

        expect(messageListResult.getMessages).to.have.been.called;
        expect(messageListResult.getThreads).to.have.been.called;

        expect(thread1.email).to.deep.equal({id: 'msg1', threadId: 'thread1', date: '10:00:00'});
        expect(thread1.date).to.equal('10:00:00');

        expect(thread2.email).to.deep.equal({id: 'msg2', threadId: 'thread2', date: '12:00:00'});
        expect(thread2.date).to.equal('12:00:00');

      });

      it('should not call jmapClient.getMessageList, when windowing is done', function(done) {
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

  describe('The rootController', function() {

    beforeEach(function() {
      mailboxesService.assignMailboxesList = sinon.spy();
    });

    it('should call the mailboxesService.assignMailboxesLis function', function() {
      initController('rootController');

      expect(mailboxesService.assignMailboxesList).to.have.been.calledWith(scope);
    });
  });

  describe('The configurationController', function() {

    it('should set $scope.mailboxes to the qualified list of non-system mailboxes', function() {
      jmapClient.getMailboxes = function() {
        return $q.when([
          { id: 1, name: '1', role: { value: 'inbox' } },
          { id: 2, name: '2', role: {} }
        ]);
      };

      initController('configurationController');

      expect(scope.mailboxes).to.deep.equal([{ id: 2, name: '2', qualifiedName: '2', level: 1, role: {} }]);
    });

    it('should define the "configuration-index-subheader" subheader', function() {
      jmapClient.getMailboxes = function() { return $q.when([]); };
      headerService.subHeader.setInjection = sinon.spy();

      initController('configurationController');

      expect(headerService.subHeader.setInjection).to.have.been.calledWith('configuration-index-subheader', sinon.match.any);
    });

  });

  describe('The addFolderController', function() {

    it('should set $scope.mailboxes to the qualified list of mailboxes', function() {
      jmapClient.getMailboxes = function() {
        return $q.when([
          { id: 1, name: '1', role: { value: 'inbox' } },
          { id: 2, name: '2', role: {} }
        ]);
      };

      initController('addFolderController');

      expect(scope.mailboxes).to.deep.equal([
        { id: 1, name: '1', qualifiedName: '1', level: 1, role: { value: 'inbox' } },
        { id: 2, name: '2', qualifiedName: '2', level: 1, role: {} }
      ]);
    });

    it('should set $scope.mailbox to an object', function() {
      jmapClient.getMailboxes = function() {
        return $q.when([]);
      };

      initController('addFolderController');

      expect(scope.mailbox).to.deep.equal({});
    });

    it('should define the "add-folder-subheader" subheader', function() {
      jmapClient.getMailboxes = function() { return $q.when([]); };
      headerService.subHeader.setInjection = sinon.spy();

      initController('addFolderController');

      expect(headerService.subHeader.setInjection).to.have.been.calledWith('add-folder-subheader', sinon.match.any);
    });

    describe('The addFolder method', function() {

      it('should go to unifiedinbox', function() {
        jmapClient.getMailboxes = function() { return $q.when([]); };
        jmapClient.createMailbox = function() { return $q.when([]); };

        initController('addFolderController');

        scope.mailbox = { name: 'Name' };
        scope.addFolder();
        scope.$digest();

        expect($state.go).to.have.been.calledWith('unifiedinbox');
      });

      it('should do nothing if mailbox.name is not defined', function() {
        jmapClient.getMailboxes = function() { return $q.when([]); };
        jmapClient.createMailbox = sinon.spy();

        initController('addFolderController');

        scope.mailbox = { };
        scope.addFolder();
        scope.$digest();

        expect($state.go).to.not.have.been.called;
        expect(jmapClient.createMailbox).to.not.have.been.called;
      });

    });

  });

  describe('The editFolderController', function() {

    it('should set $scope.mailboxes to the qualified list of mailboxes', function() {
      jmapClient.getMailboxes = function() {
        return $q.when([
          { id: 1, name: '1', role: { value: 'inbox' } },
          { id: 2, name: '2', role: {} }
        ]);
      };

      initController('editFolderController');

      expect(scope.mailboxes).to.deep.equal([
        { id: 1, name: '1', qualifiedName: '1', level: 1, role: { value: 'inbox' } },
        { id: 2, name: '2', qualifiedName: '2', level: 1, role: {} }
      ]);
    });

    it('should set $scope.mailbox to the found mailbox', function() {
      jmapClient.getMailboxes = function() {
        return $q.when([
          { id: 'chosenMailbox', name: '1', role: { value: 'inbox' } },
          { id: 2, name: '2', role: {} }
        ]);
      };

      initController('editFolderController');

      expect(scope.mailbox).to.deep.equal({ id: 'chosenMailbox', name: '1', qualifiedName: '1', level: 1, role: { value: 'inbox' } });
    });

    it('should define the "edit-folder-subheader" subheader', function() {
      jmapClient.getMailboxes = function() { return $q.when([]); };
      headerService.subHeader.setInjection = sinon.spy();

      initController('editFolderController');

      expect(headerService.subHeader.setInjection).to.have.been.calledWith('edit-folder-subheader', sinon.match.any);
    });

    describe('The editFolder method', function() {

      it('should go to unifiedinbox', function() {
        jmapClient.getMailboxes = function() { return $q.when([]); };
        jmapClient.updateMailbox = function() { return $q.when([]); };

        initController('editFolderController');

        scope.mailbox = { name: 'Name' };
        scope.editFolder();
        scope.$digest();

        expect($state.go).to.have.been.calledWith('unifiedinbox');
      });

      it('should do nothing if mailbox.name is not defined', function() {
        jmapClient.getMailboxes = function() { return $q.when([]); };
        jmapClient.updateMailbox = sinon.spy();

        initController('editFolderController');

        scope.mailbox = {};
        scope.editFolder();
        scope.$digest();

        expect($state.go).to.not.have.been.called;
        expect(jmapClient.updateMailbox).to.not.have.been.called;
      });

    });

    describe('the deleteFolder method', function() {
      var weakSuccessSpy, weakErrorSpy, weakInfoSpy;

      beforeEach(function() {
        jmapClient.getMailboxes = function() {return $q.when([]);};
        jmapClient.destroyMailbox = sinon.spy(function() {return $q.when([]);});
        weakSuccessSpy = sinon.spy();
        weakErrorSpy = sinon.spy();
        weakInfoSpy = sinon.spy();
        notificationFactory.weakSuccess = weakSuccessSpy;
        notificationFactory.weakError = weakErrorSpy;
        notificationFactory.weakInfo = weakInfoSpy;
      });

      it('should call client.destroyMailbox', function() {
        initController('editFolderController');

        scope.mailbox = {
          id: 123
        };
        scope.deleteFolder();
        scope.$digest();

        expect(jmapClient.destroyMailbox).to.have.been.calledWith(123);
      });

      it('should go to unifiedinbox afterwards', function() {
        initController('editFolderController');

        scope.mailbox = {
          id: 123
        };
        scope.deleteFolder();
        scope.$digest();

        expect($state.go).to.have.been.calledWith('unifiedinbox');
      });

    });

    describe('the confirmationDialog method', function() {
      it('should leverage $modal service', function() {
        jmapClient.getMailboxes = function() { return $q.when([]); };
        initController('editFolderController');

        scope.confirmationDialog();
        expect($modal).to.have.been.called;
      });
    });

  });

  describe('The goToInboxController', function() {

    it('should requests the INBOX mailbox, and move to it when found', function() {
      $state.go = sinon.spy();
      jmapClient.getMailboxWithRole = function() { return $q.when({ id: '1' }); };

      initController('goToInboxController');

      expect($state.go).to.have.been.calledWith('unifiedinbox.threads', { mailbox: '1' });
    });

  });

  describe('The recipientsFullscreenEditFormController', function() {

    beforeEach(function() {
      headerService.subHeader.setVisibleMD = sinon.spy();
    });

    it('should go to unifiedinbox.compose if $stateParams.rcpt is not defined', function() {
      $state.go = sinon.spy();

      initController('recipientsFullscreenEditFormController');

      expect($state.go).to.have.been.calledWith('unifiedinbox.compose');
    });

    it('should go to unifiedinbox.compose if $stateParams.composition is not defined', function() {
      $state.go = sinon.spy();
      $stateParams.rcpt = 'to';

      initController('recipientsFullscreenEditFormController');

      expect($state.go).to.have.been.calledWith('unifiedinbox.compose');
    });

    it('should expose $stateParams.rcpt and $stateParams.composition in the scope', function() {
      $stateParams.rcpt = 'to';
      $stateParams.composition = 'composition';

      initController('recipientsFullscreenEditFormController');

      expect(scope.composition).to.equal('composition');
      expect(scope.rcpt).to.equal('to');
    });

    it('should define the "fullscreen-edit-form-subheader" subheader', function() {
      headerService.subHeader.setInjection = sinon.spy();

      initController('recipientsFullscreenEditFormController');

      expect(headerService.subHeader.setInjection).to.have.been.calledWith('fullscreen-edit-form-subheader', sinon.match.any);
    });

    it('should call headerService.subHeader.setVisibleMD', function() {
      initController('recipientsFullscreenEditFormController');

      expect(headerService.subHeader.setVisibleMD).to.have.been.called;
    });

  });

  describe('The attachmentController', function() {

    describe('the download function', function() {

      it('should call $window.open', function() {
        initController('attachmentController').download({url: 'url'});

        expect(windowMock.open).to.have.been.calledWith('url');
      });
    });

  });

});
