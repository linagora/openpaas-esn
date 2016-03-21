'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The linagora.esn.unifiedinbox module controllers', function() {

  var $stateParams, $rootScope, scope, $controller,
      jmapClient, jmap, notificationFactory, draftService, Offline = {},
      emailSendingService, Composition, newComposerService = {}, $state, $modal,
      mailboxesService, inboxEmailService, _, windowMock, fileUploadMock, config;
  var JMAP_GET_MESSAGES_VIEW, JMAP_GET_MESSAGES_LIST, ELEMENTS_PER_PAGE,
      DEFAULT_FILE_TYPE, DEFAULT_MAX_SIZE_UPLOAD, ELEMENTS_PER_REQUEST;

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
      config = {};
      config['linagora.esn.unifiedinbox.uploadUrl'] = 'http://jmap';
      config['linagora.esn.unifiedinbox.maxSizeUpload'] = DEFAULT_MAX_SIZE_UPLOAD;
      fileUploadMock = {
        addFile: function() {
          return {
            defer: $q.defer()
          };
        }
      };

      $provide.value('withJmapClient', function(callback) {
        return callback(jmapClient);
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
      $provide.value('$state', $state);
      $provide.constant('ELEMENTS_PER_PAGE', 2);
      $provide.value('fileUploadService', {
        get: function() {
          return fileUploadMock;
        }
      });
      $provide.value('esnConfig', function(key, defaultValue) {
        return $q.when().then(function() {
          return angular.isDefined(config[key]) ? config[key] : defaultValue;
        });
      });
    });
  });

  beforeEach(angular.mock.inject(function(_$rootScope_, _$controller_, _jmap_, _$timeout_, _emailSendingService_,
                                          _Composition_, _mailboxesService_, _inboxEmailService_, ___, _JMAP_GET_MESSAGES_VIEW_,
                                          _JMAP_GET_MESSAGES_LIST_, _ELEMENTS_PER_PAGE_, _DEFAULT_FILE_TYPE_,
                                          _DEFAULT_MAX_SIZE_UPLOAD_, _ELEMENTS_PER_REQUEST_) {
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
    ELEMENTS_PER_REQUEST = _ELEMENTS_PER_REQUEST_;

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

      scope.hide = sinon.spy();
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
      expect(Composition.prototype.send).to.have.been.calledOnce;
    });

    it('should initialize the controller when a Composition instance is given in state params', function() {
      $stateParams.composition = { getEmail: angular.noop };

      var ctrl = initController('composerController');

      expect(ctrl.getComposition()).to.deep.equal($stateParams.composition);
    });

    it('should initialize the controller when an email is given in state params', function() {
      $stateParams.email = { to: [] };

      var ctrl = initController('composerController');

      expect(ctrl.getComposition()).to.be.an.instanceof(Composition);
      expect(scope.email).to.be.a('object');
    });

    describe('The onAttachmentsSelect function', function() {

      var ctrl;

      beforeEach(function() {
        fileUploadMock = {
          addFile: function() {
            var defer = $q.defer();

            defer.resolve({
              response: {
                blobId: '1234',
                url: 'http://jmap/1234'
              }
            });

            return {
              defer: defer
            };
          }
        };

        ctrl = initController('composerController');

        ctrl.initCtrlWithComposition({
          canBeSentOrNotify: function() { return true; },
          saveDraft: sinon.spy(),
          send: sinon.spy(),
          getEmail: sinon.stub().returns({}),
          saveDraftSilently: sinon.stub().returns($q.when(new jmap.CreateMessageAck({destroyMessage: sinon.spy()}, {
            id: 'expected id',
            blobId: 'any',
            size: 5
          })))
        });
      });

      it('should do nothing if no files are given', function() {
        ctrl.onAttachmentsSelect();

        expect(scope.email.attachments).to.equal(undefined);
      });

      it('should do nothing if files is zerolength', function() {
        ctrl.onAttachmentsSelect([]);

        expect(scope.email.attachments).to.equal(undefined);
      });

      it('should put the attachment in the scope, with a default file type', function(done) {
        ctrl.onAttachmentsSelect([{ name: 'name', size: 1 }]).then(function() {
          expect(scope.email.attachments[0]).to.shallowDeepEqual({
            blobId: '1234',
            name: 'name',
            size: 1,
            type: DEFAULT_FILE_TYPE
          });

          done();
        });

        $rootScope.$digest();
      });

      it('should put the attachment in the scope, if the file size is exactly the limit', function() {
        ctrl.onAttachmentsSelect([{ name: 'name', size: DEFAULT_MAX_SIZE_UPLOAD }]).then(function() {
          expect(scope.email.attachments.length).to.equal(1);
        });

        $rootScope.$digest();
      });

      it('should set the blobId and the url when upload succeeds', function() {
        ctrl.onAttachmentsSelect([{ name: 'name', size: 1 }]);
        $rootScope.$digest();

        expect(scope.email.attachments[0]).to.shallowDeepEqual({
          blobId: '1234',
          url: 'http://jmap/1234',
          name: 'name',
          size: 1,
          type: DEFAULT_FILE_TYPE,
          status: 'uploaded'
        });
      });

      it('should save the composition each time that and upload succeeds', function() {
        ctrl.onAttachmentsSelect([{ name: 'name', size: 1 }]);
        ctrl.onAttachmentsSelect([{ name: 'name', size: 1 }]);
        $rootScope.$digest();

        expect(ctrl.getComposition().saveDraftSilently).to.have.been.calledTwice;
      });

      it('should not save intermediate drafts when saveDraft has been called', function() {
        ctrl.saveDraft();
        ctrl.onAttachmentsSelect([{ name: 'name', size: 1 }]);
        ctrl.onAttachmentsSelect([{ name: 'name', size: 1 }]);
        $rootScope.$digest();

        expect(ctrl.getComposition().saveDraftSilently).to.have.not.been.called;
      });

      it('should not save intermediate drafts when send has been called', function() {
        scope.send();
        ctrl.onAttachmentsSelect([{ name: 'name', size: 1 }]);
        ctrl.onAttachmentsSelect([{ name: 'name', size: 1 }]);
        $rootScope.$digest();

        expect(ctrl.getComposition().saveDraftSilently).to.have.not.been.called;
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

        ctrl.onAttachmentsSelect([{ name: 'name', size: 1 }]);
        $rootScope.$digest();

        expect(scope.email.attachments[0]).to.shallowDeepEqual({
          error: 'WTF',
          status: 'error'
        });
      });

      it('should resolve the upload promise with nothing when upload succeeds', function(done) {
        ctrl.onAttachmentsSelect([{ name: 'name', size: 1 }]).then(function() {
          scope.email.attachments[0].upload.promise.then(done);
        });

        $rootScope.$digest();
      });

      it('should resolve the upload promise with nothing when upload fails', function(done) {
        fileUploadMock = {
          addFile: function() {
            var defer = $q.defer();

            defer.reject('WTF');

            return {
              defer: defer
            };
          }
        };

        ctrl.onAttachmentsSelect([{ name: 'name', size: 1 }]).then(function() {
          scope.email.attachments[0].upload.promise.then(done);
        });

        $rootScope.$digest();
      });

      it('should notify and not add the attachment if file is larger that the default limit', function() {
        initController('composerController').onAttachmentsSelect([{ name: 'name', size: DEFAULT_MAX_SIZE_UPLOAD + 1 }]).then(function() {
          expect(notificationFactory.weakError).to.have.been.calledWith('', 'File name ignored as its size exceeds the 20MB limit');
          expect(scope.email.attachments).to.deep.equal([]);
        });

        $rootScope.$digest();
      });

      it('should notify and not add the attachment if file is larger that a configured limit', function() {
        config['linagora.esn.unifiedinbox.maxSizeUpload'] = 1024 * 1024; // 1MB
        initController('composerController').onAttachmentsSelect([{ name: 'name', size: 1024 * 1024 * 2 }]).then(function() {
          expect(notificationFactory.weakError).to.have.been.calledWith('', 'File name ignored as its size exceeds the 1MB limit');
          expect(scope.email.attachments).to.deep.equal([]);
        });

        $rootScope.$digest();
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

          ctrl.onAttachmentsSelect([{ name: 'name', size: 1 }]);
          $rootScope.$digest();

          var attachment = scope.email.attachments[0];

          attachment.startUpload();

          expect(attachment.upload.progress).to.equal(0);
          expect(attachment.status).to.equal('uploading');
        });

      });

    });

    describe('The removeAttachment function', function() {

      var ctrl;

      beforeEach(function() {
        ctrl = initController('composerController');
        ctrl.initCtrl({});
        ctrl.getComposition().saveDraftSilently = sinon.spy();
      });

      it('should cancel an ongoing upload', function(done) {
        var attachment = { upload: { cancel: done } };
        scope.email.attachments = [attachment];

        ctrl.removeAttachment(attachment);
      });

      it('should remove the attachment from the email', function() {
        var attachment = { blobId: 'willBeRemoved', upload: { cancel: angular.noop } };
        scope.email.attachments = [attachment, { blobId: '1' }];

        ctrl.removeAttachment(attachment);

        expect(scope.email.attachments).to.deep.equal([{ blobId: '1' }]);
      });

      it('should remove attachments that do not have upload attributes', function() {
        var attachment = { blobId: 'willBeRemoved'};
        scope.email.attachments = [attachment, { blobId: '1' }];

        ctrl.removeAttachment(attachment);

        expect(scope.email.attachments).to.deep.equal([{ blobId: '1' }]);
      });

      it('should save the draft silently', function() {
        var attachment = { blobId: 'willBeRemoved'};
        scope.email.attachments = [attachment];

        ctrl.removeAttachment(attachment);

        expect(ctrl.getComposition().saveDraftSilently).to.have.been.calledWith();
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

    describe('The loadMoreElements function', function() {

      function loadMoreElements() {
        initController('listEmailsController');

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
          getMessages: function() {return [];}
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

    it('should build an EmailGroupingTool with the list of messages, and assign it to scope.groupedEmails', function(done) {
      initController('listEmailsController');

      scope.$watch('groupedElements', function(before, after) {
        expect(after).to.be.a('Array');

        done();
      });
      scope.$digest();
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

    it('should expose a "reply" function', function() {
      inboxEmailService.reply = sinon.spy();

      initController('viewEmailController').reply();

      expect(inboxEmailService.reply).to.have.been.calledWith(scope.email);
    });

    it('should expose a "replyAll" function', function() {
      inboxEmailService.replyAll = sinon.spy();

      initController('viewEmailController').replyAll();

      expect(inboxEmailService.replyAll).to.have.been.calledWith(scope.email);
    });

    it('should expose a "forward" function', function() {
      inboxEmailService.forward = sinon.spy();

      initController('viewEmailController').forward();

      expect(inboxEmailService.forward).to.have.been.calledWith(scope.email);
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

    it('should set isCollapsed=false for the only one email in a thread', function() {
      mockGetThreadAndMessages([
        {id: 'email1', mailboxIds: [threadId], subject: 'thread subject1'}
      ]);

      initController('viewThreadController');

      expect(_.pluck(scope.thread.emails, 'isCollapsed')).to.deep.equal([false]);
    });

    it('should set isCollapsed=false for unread emails along with the last email', function() {
      mockGetThreadAndMessages([
        {id: 'email1', mailboxIds: [threadId], subject: 'thread subject1', isUnread: false },
        {id: 'email2', mailboxIds: [threadId], subject: 'thread subject2', isUnread: true },
        {id: 'email3', mailboxIds: [threadId], subject: 'thread subject3', isUnread: false }
      ]);

      initController('viewThreadController');

      expect(_.pluck(scope.thread.emails, 'isCollapsed')).to.deep.equal([true, false, false]);
    });

    it('should set isCollapsed=true for all read emails except the last one', function() {
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

      scope.$watch('groupedElements', function(before, after) {
        expect(after).to.be.a('Array');

        done();
      });
      scope.$digest();
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

        expect(thread1.email).to.deep.equal({id: 'msg1', threadId: 'thread1', date: '2016-03-21T10:16:22.628Z'});
        expect(thread1.date).to.equalTime(new Date('2016-03-21T10:16:22.628Z'));

        expect(thread2.email).to.deep.equal({id: 'msg2', threadId: 'thread2', date: '2016-03-22T10:16:22.628Z'});
        expect(thread2.date).to.equalTime(new Date('2016-03-22T10:16:22.628Z'));

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

  describe('The recipientsFullscreenEditFormController', function() {

    beforeEach(function() {
      $state.go = sinon.spy();
      $stateParams.recipientsType = 'to';
      $stateParams.composition = {
        email: {
          to: 'to email'
        }
      };
    });

    it('should go to unifiedinbox.compose if $stateParams.recipientsType is not defined', function() {
      $stateParams.recipientsType = undefined;

      initController('recipientsFullscreenEditFormController');

      expect($state.go).to.have.been.calledWith('unifiedinbox.compose');
    });

    it('should go to unifiedinbox.compose if $stateParams.composition is not defined', function() {
      $stateParams.composition = undefined;

      initController('recipientsFullscreenEditFormController');

      expect($state.go).to.have.been.calledWith('unifiedinbox.compose');
    });

    it('should go to unifiedinbox.compose if $stateParams.composition.email is not defined', function() {
      $stateParams.composition = {};

      initController('recipientsFullscreenEditFormController');

      expect($state.go).to.have.been.calledWith('unifiedinbox.compose');
    });

    it('should expose $stateParams.recipientsType and $stateParams.composition in the scope', function() {
      initController('recipientsFullscreenEditFormController');

      expect(scope.recipients).to.equal('to email');
      expect(scope.recipientsType).to.equal('to');
    });

    it('should go to parent with stateParams.composition when backToComposition is called', function() {
      initController('recipientsFullscreenEditFormController');

      scope.backToComposition();

      expect($state.go).to.have.been.calledWith('^', { composition: $stateParams.composition });
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

  describe('The listTwitterController', function() {

    beforeEach(function() {
      $stateParams.username = 'AwesomePaas';
    });

    beforeEach(inject(function(session) {
      session.user.accounts = [{
        data: {
          id: 'idAwesomePaas',
          provider: 'twitter',
          username: 'AwesomePaas'
        }
      }, {
        data: {
          id: 'idAnother',
          provider: 'twitter',
          username: 'AnotherTwtterAccount'
        }
      }];
    }));

    it('should set $scope.username to the correct value', function() {
      initController('listTwitterController');

      expect(scope.username).to.equal('AwesomePaas');
    });

  });

});
