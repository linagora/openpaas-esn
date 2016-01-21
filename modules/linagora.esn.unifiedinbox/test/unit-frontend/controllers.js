'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The linagora.esn.unifiedinbox module controllers', function() {

  var $stateParams, $rootScope, $location, scope, $controller, $timeout,
      jmapClient, jmap, notificationFactory, attendeeService, draftService, Offline = {},
      emailSendingService, Composition, newComposerService = {}, headerService, $state, $modal;

  beforeEach(function() {
    $stateParams = {
      mailbox: 'chosenMailbox',
      emailId: '4'
    };
    notificationFactory = {
      weakSuccess: angular.noop,
      weakError: angular.noop,
      strongInfo: function() { return { close: angular.noop }; }
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
    $modal = sinon.spy();

    angular.mock.module('esn.core');
    angular.mock.module('esn.notification');

    module('linagora.esn.unifiedinbox', function($provide) {
      jmapClient = {};
      $provide.value('withJmapClient', function(callback) {
        return callback(jmapClient);
      });
      $provide.value('$stateParams', $stateParams);
      $provide.value('$location', $location = {
        url: angular.noop
      });
      $provide.value('notificationFactory', notificationFactory);
      $provide.value('Offline', Offline);
      $provide.value('$modal', $modal);
      $provide.value('draftService', draftService = {});
      $provide.value('attendeeService', attendeeService = {
        addProvider: angular.noop
      });
      $provide.value('newComposerService', newComposerService);
      $provide.value('headerService', headerService);
      $provide.value('$state', $state);
    });
  });

  beforeEach(angular.mock.inject(function(_$rootScope_, _$controller_, _jmap_, _$timeout_, _emailSendingService_, _Composition_) {
    $rootScope = _$rootScope_;
    $controller = _$controller_;
    jmap = _jmap_;
    $timeout = _$timeout_;
    emailSendingService = _emailSendingService_;
    Composition = _Composition_;

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

    it('should delegate searching to attendeeService', function(done) {
      var ctrl = initCtrl();
      attendeeService.getAttendeeCandidates = function(query, limit) {
        expect(query).to.equal('open-paas.org');

        done();
      };

      ctrl.search('open-paas.org');
    });

    it('should exclude search results with no email', function(done) {
      var ctrl = initCtrl();
      attendeeService.getAttendeeCandidates = function(query, limit) {
        expect(query).to.equal('open-paas.org');

        return $q.when([{
          displayName: 'user1',
          email: 'user1@open-paas.org'
        }, {
          displayName: 'user2'
        }]);
      };

      ctrl.search('open-paas.org')
        .then(function(results) {
          expect(results).to.deep.equal([{
            displayName: 'user1',
            email: 'user1@open-paas.org'
          }]);
        })
        .then(done, done);

      scope.$digest();
    });
  });

  describe('The listEmailsController', function() {

    beforeEach(function() {
      jmapClient.getMailboxes = function() {
        return $q.when([{role: jmap.MailboxRole.UNKNOWN, name: 'a name'}]);
      };
      jmapClient.getMessageList = function() {
        return $q.when({getMessages: angular.noop});
      };
    });

    it('should set $scope.mailbox from the \'mailbox\' route parameter', function() {
      initController('listEmailsController');

      expect(scope.mailbox).to.equal('chosenMailbox');
    });

    it('should call jmapClient.getMailboxes with the expected mailbox id and properties', function(done) {
      jmapClient.getMailboxes = function(options) {
        expect(options).to.deep.equal({ids: ['chosenMailbox'], properties: ['name', 'role']});
        done();
      };

      initController('listEmailsController');
    });

    it('should call jmapClient.getMailboxes then find the mailbox role and name', function() {
      jmapClient.getMailboxes = function() {
        return $q.when([{role: 'expected role', name: 'expected name'}]);
      };

      initController('listEmailsController');
      $timeout.flush();

      expect(scope.mailboxRole).to.equal('expected role');
      expect(scope.mailboxName).to.equal('expected name');
    });

    it('should call jmapClient.getMailboxes then jmapClient.getMessageList', function(done) {
      jmapClient.getMailboxes = sinon.stub().returns($q.when([{}]));
      jmapClient.getMessageList = function() {
        done();
      };

      initController('listEmailsController');
      $timeout.flush();
    });

    it('should call jmapClient.getMessageList with correct arguments', function(done) {
      jmapClient.getMessageList = function(options) {
        expect(options).to.deep.equal({
          filter: {
            inMailboxes: ['chosenMailbox']
          },
          collapseThreads: true,
          fetchMessages: false,
          position: 0,
          limit: 100
        });

        done();
      };

      initController('listEmailsController');
      $timeout.flush();
    });

    it('should call jmapClient.getMessageList then getMessages with expected options', function(done) {
      var messageListResult = {
        getMessages: function(options) {
          expect(options).to.deep.equal({
            properties: ['id', 'threadId', 'subject', 'from', 'to', 'preview', 'date', 'isUnread', 'hasAttachment', 'mailboxIds']
          });

          done();
        }
      };

      jmapClient.getMessageList = function() {
        return $q.when(messageListResult);
      };

      initController('listEmailsController');
      $timeout.flush();
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
        jmapClient.getMailboxes = function() {
          return $q.when([{role: jmap.MailboxRole.DRAFTS, name: 'my drafts'}]);
        };
        newComposerService.openDraft = sinon.spy();

        initController('listEmailsController');
        $timeout.flush();

        scope.openEmail({email: 'object'});

        expect(newComposerService.openDraft).to.have.been.calledWith({email: 'object'});
      });

      it('should change state if mailbox has not the draft role', function() {
        jmapClient.getMailboxes = function() {
          return $q.when([{role: jmap.MailboxRole.INBOX, name: 'my box'}]);
        };
        $state.go = sinon.spy();

        initController('listEmailsController');
        $timeout.flush();

        scope.openEmail({id: 'expectedId'});

        expect($state.go).to.have.been.calledWith('unifiedinbox.email', { emailId: 'expectedId', mailbox: 'chosenMailbox' });
      });

    });

  });

  describe('The viewEmailController', function() {

    beforeEach(function() {
      jmapClient.getMessages = function() { return $q.reject(); };
    });

    it('should set $scope.mailbox and $scope.emailId from the route parameters', function() {
      initController('viewEmailController');

      expect(scope.mailbox).to.equal('chosenMailbox');
      expect(scope.emailId).to.equal('4');
    });

    it('should call jmapClient.getMessages with correct arguments', function(done) {
      jmapClient.getMessages = function(options) {
        expect(options).to.deep.equal({
          ids: ['4']
        });

        done();
      };

      initController('viewEmailController');
    });

    it('should assign the returned message to $scope.email', function(done) {
      jmapClient.getMessages = function() {
        return $q.when([{ property: 'property' }]);
      };

      initController('viewEmailController');

      scope.$watch('email', function(before, after) {
        expect(after).to.deep.equal({ property: 'property' });

        done();
      });

      scope.$digest();
    });

    it('should mark an unread email as read', function() {
      var setIsUnreadSpy = sinon.spy();
      jmapClient.getMessages = function() {
        return $q.when([{ isUnread: true, setIsUnread: setIsUnreadSpy }]);
      };

      initController('viewEmailController');

      expect(setIsUnreadSpy).to.have.been.calledWith(false);
    });

    it('should not invoke setIsUnread on a read email', function() {
      var setIsUnreadSpy = sinon.spy();
      jmapClient.getMessages = function() {
        return $q.when([{ isUnread: false, setIsUnread: setIsUnreadSpy }]);
      };

      initController('viewEmailController');

      expect(setIsUnreadSpy).to.not.have.been.called;
    });

    it('should display the view-email-subheader mobile header', function() {
      headerService.subHeader.setInjection = sinon.spy();

      initController('viewEmailController');

      expect(headerService.subHeader.setInjection).to.have.been.calledWith('view-email-subheader', sinon.match.any);
    });

    describe('The moveToTrash fn', function() {

      it('should call $scope.email.moveToMailboxWithRole with the "trash" role', function(done) {
        jmapClient.getMessages = function() {
          return $q.when([{
            moveToMailboxWithRole: function(role) {
              expect(role).to.equal(jmap.MailboxRole.TRASH);

              done();
            }
          }]);
        };

        initController('viewEmailController');

        scope.moveToTrash();
      });

      it('should update location to the parent mailbox when the message was successfully moved', function() {
        jmapClient.getMessages = function() {
          return $q.when([{
            moveToMailboxWithRole: function() {
              return $q.when();
            }
          }]);
        };

        initController('viewEmailController');

        scope.moveToTrash();
        scope.$digest();

        expect($state.go).to.have.been.calledWith('unifiedinbox.mailbox', { mailbox: 'chosenMailbox' });
      });

      it('should notify weakSuccess when the message was successfully moved', function(done) {
        jmapClient.getMessages = function() {
          return $q.when([{
            moveToMailboxWithRole: function() {
              return $q.when();
            }
          }]);
        };
        notificationFactory.weakSuccess = function() { done(); };

        initController('viewEmailController');

        scope.moveToTrash();
        scope.$digest();
      });

      it('should notify weakError when the message cannot be moved', function(done) {
        jmapClient.getMessages = function() {
          return $q.when([{
            moveToMailboxWithRole: function() {
              return $q.reject('Fail');
            }
          }]);
        };
        notificationFactory.weakError = function() { done(); };

        initController('viewEmailController');

        scope.moveToTrash();
        scope.$digest();
      });

    });

    describe('the reply function', function() {
      it('should leverage openEmailCustomTitle() and createReplyEmailObject()', function() {
        newComposerService.openEmailCustomTitle = sinon.spy();
        emailSendingService.createReplyEmailObject = sinon.spy(function() { return $q.when(); });

        jmapClient.getMessages = function() {
          return $q.when([{
            email:'sender@linagora.com'
          }]);
        };

        initController('viewEmailController');

        scope.reply();
        scope.$digest();

        expect(newComposerService.openEmailCustomTitle).to.have.been.calledWith('Start writing your reply email');
        expect(emailSendingService.createReplyEmailObject).to.have.been.called;
      });
    });

    describe('the replyAll function', function() {
      it('should leverage openEmailCustomTitle() and createReplyAllEmailObject()', function() {
        newComposerService.openEmailCustomTitle = sinon.spy();
        emailSendingService.createReplyAllEmailObject = sinon.spy(function() { return $q.when(); });

        jmapClient.getMessages = function() {
          return $q.when([{
            email:'sender@linagora.com'
          }]);
        };

        initController('viewEmailController');

        scope.replyAll();
        scope.$digest();

        expect(newComposerService.openEmailCustomTitle).to.have.been.calledWith('Start writing your reply all email');
        expect(emailSendingService.createReplyAllEmailObject).to.have.been.called;
      });
    });

    describe('the forward function', function() {
      it('should leverage openEmailCustomTitle() and createForwardEmailObject()', function() {
        newComposerService.openEmailCustomTitle = sinon.spy();
        emailSendingService.createForwardEmailObject = sinon.spy(function() { return $q.when(); });

        jmapClient.getMessages = function() {
          return $q.when([{
            email:'sender@linagora.com'
          }]);
        };

        initController('viewEmailController');

        scope.forward();
        scope.$digest();

        expect(newComposerService.openEmailCustomTitle).to.have.been.calledWith('Start writing your forward email');
        expect(emailSendingService.createForwardEmailObject).to.have.been.called;
      });
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

      expect($state.go).to.have.been.calledWith('unifiedinbox.mailbox', { mailbox: '1' });
    });

  });

});
