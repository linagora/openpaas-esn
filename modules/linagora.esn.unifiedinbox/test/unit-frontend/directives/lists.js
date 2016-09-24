'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The linagora.esn.unifiedinbox List module directives', function() {

  var $compile, $rootScope, $scope, element, jmap, inboxConfigMock, inboxJmapItemService;

  beforeEach(function() {
    angular.mock.module('esn.core');
    angular.mock.module('linagora.esn.unifiedinbox');
    module('jadeTemplates');
  });

  beforeEach(module(function($provide) {

    inboxConfigMock = {};

    $provide.value('inboxConfig', function(key, defaultValue) {
      return $q.when(angular.isDefined(inboxConfigMock[key]) ? inboxConfigMock[key] : defaultValue);
    });

    $provide.decorator('newComposerService', function($delegate) {
      $delegate.open = sinon.spy(); // overwrite newComposerService.open() with a mock

      return $delegate;
    });
  }));

  beforeEach(inject(function(_$compile_, _$rootScope_, _jmap_, _inboxJmapItemService_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    jmap = _jmap_;
    inboxJmapItemService = _inboxJmapItemService_;

    $scope = $rootScope.$new();

  }));

  afterEach(function() {
    if (element) {
      element.remove();
    }
  });

  function compileDirective(html, data) {
    element = angular.element(html);
    element.appendTo(document.body);

    if (data) {
      Object.keys(data).forEach(function(key) {
        element.data(key, data[key]);
      });
    }

    $compile(element)($scope);
    $scope.$digest();

    return element;
  }

  describe('The inboxThreadListItem directive', function() {

    describe('the exposed functions from inboxJmapItemService', function() {
      beforeEach(function() {
        ['markAsUnread', 'markAsRead', 'markAsFlagged', 'unmarkAsFlagged'].forEach(function(action) {
          inboxJmapItemService[action] = sinon.spy();
        });
      });

      it('should expose several functions to the element controller', function() {
        compileDirective('<inbox-thread-list-item />');

        ['markAsUnread', 'markAsRead', 'markAsFlagged', 'unmarkAsFlagged'].forEach(function(action) {
          element.controller('inboxThreadListItem')[action]();
          expect(inboxJmapItemService[action]).to.have.been.called;
        });
      });
    });

    describe('openThread fn', function() {

      var $state, $stateParams, newComposerService;

      beforeEach(angular.mock.inject(function(_$state_, _$stateParams_, _newComposerService_) {
        $state = _$state_;
        $stateParams = _$stateParams_;
        newComposerService = _newComposerService_;

        $state.go = sinon.spy();
        $stateParams.mailbox = null;
      }));

      function openThread(thread) {
        return element.controller('inboxThreadListItem').openThread(thread);
      }

      it('should call newComposerService.openDraft if message is a draft', function() {
        compileDirective('<inbox-thread-list-item />');
        newComposerService.openDraft = sinon.spy();

        openThread({ email: { id: 'id', isDraft: true } });

        expect(newComposerService.openDraft).to.have.been.calledWith('id');
      });

      it('should change state to thread view with $stateParams.mailbox parameter', function() {
        var thread = { id: 'expectedId', email: {} };

        $stateParams.mailbox = '123';
        $scope.mailbox = { id: '456' };

        compileDirective('<inbox-thread-list-item />');
        openThread(thread);

        expect($state.go).to.have.been.calledWith('.thread', {
          threadId: 'expectedId',
          mailbox: $stateParams.mailbox,
          item: thread
        });
      });

      it('should change state to $scope.mailbox.id if present and message is not a draft', function() {
        var thread = { id: 'expectedId', email: {} };

        $scope.mailbox = { id: 'chosenMailbox' };

        compileDirective('<inbox-thread-list-item />');
        openThread(thread);

        expect($state.go).to.have.been.calledWith('.thread', {
          threadId: 'expectedId',
          mailbox: $scope.mailbox.id,
          item: thread
        });
      });

      it('should change state to the first mailbox of the message if message is not a draft', function() {
        var thread = { id: 'expectedId', email: { mailboxIds: ['chosenMailbox', 'mailbox2'] } };

        compileDirective('<inbox-thread-list-item />');
        openThread(thread);

        expect($state.go).to.have.been.calledWith('.thread', {
          threadId: 'expectedId',
          mailbox: 'chosenMailbox',
          item: thread
        });
      });

    });

    describe('The moveToTrash function', function() {
      var controller;

      beforeEach(function() {
        $scope.item = {
          moveToMailboxWithRole: sinon.stub().returns($q.when())
        };

        $scope.groups = {
          addElement: sinon.spy(),
          removeElement: sinon.spy()
        };

        compileDirective('<inbox-thread-list-item />');
        controller = element.controller('inboxThreadListItem');
      });

      it('should immediately remove thread from the list', function() {
        controller.moveToTrash();
        expect($scope.groups.removeElement).to.have.been.calledWith($scope.item);
      });

      it('should move thread to Trash folder using moveToMailboxWithRole method', function() {
        controller.moveToTrash();
        expect($scope.item.moveToMailboxWithRole).to.have.been.calledWith(jmap.MailboxRole.TRASH);
      });

      it('should add thread to the list again on failure', function(done) {
        $scope.item.moveToMailboxWithRole = function() {return $q.reject(); };

        controller.moveToTrash().then(done.bind(null, 'should reject'), function() {
          expect($scope.groups.addElement).to.have.been.calledWith($scope.item);
          done();
        });

        $rootScope.$digest();
      });

    });

    describe('The swipe feature', function() {

      beforeEach(function() {
        $scope.item = {
          moveToMailboxWithRole: sinon.spy(function() {return $q.when();}),
          isUnread: true,
          setIsUnread: function(state) {
            this.isUnread = state;

            return $q.when();
          }
        };

        $scope.groups = {
          addElement: angular.noop,
          removeElement: angular.noop
        };
        compileDirective('<inbox-thread-list-item />');
      });

      it('should use swipe directive as CSS class', function() {
        expect(element.find('.swipe').length).to.equal(1);
      });

      describe('The onSwipeRight fn', function() {

        it('should mark thread as read by default feature flip', function(done) {
          $scope.onSwipeRight().then(function() {
            expect($scope.item.isUnread).to.be.false;
            done();
          });

          $rootScope.$digest();
        });

        it('should move thread to Trash if feature flip is set to moveToTrash', function(done) {
          inboxConfigMock.swipeRightAction = 'moveToTrash';

          $scope.onSwipeRight().then(function() {
            expect($scope.item.moveToMailboxWithRole).to.have.been.calledWith(jmap.MailboxRole.TRASH);
            done();
          });

          $rootScope.$digest();
        });

      });

    });

    describe('The dragndrop feature', function() {

      it('should be draggable element', function() {
        compileDirective('<inbox-thread-list-item />');

        expect(element.find('.clickable').attr('esn-draggable')).to.equal('esn-draggable');
      });

      it('should remove item from list on drag end with a drop', function() {
        compileDirective('<inbox-thread-list-item />');

        $scope.item = 'an item';
        $scope.groups = {
          removeElement: sinon.spy()
        };

        $scope.onDragEnd(true);

        expect($scope.groups.removeElement).to.have.been.calledOnce;
        expect($scope.groups.removeElement).to.have.been.calledWith($scope.item);
      });

      it('should not remove item from list on drag end with no drop', function() {
        compileDirective('<inbox-thread-list-item />');

        $scope.item = 'an item';
        $scope.groups = {
          removeElement: sinon.spy()
        };

        $scope.onDragEnd(false);

        expect($scope.groups.removeElement).to.have.been.callCount(0);
      });

      it('should add item back to the list on drop failure', function() {
        compileDirective('<inbox-thread-list-item />');

        $scope.item = 'an item';
        $scope.groups = {
          addElement: sinon.spy()
        };

        $scope.onDropFailure();

        expect($scope.groups.addElement).to.have.been.calledOnce;
        expect($scope.groups.addElement).to.have.been.calledWith($scope.item);

      });

    });

  });

  describe('The inboxMessageListItem directive', function() {

    describe('the exposed functions from inboxJmapItemService', function() {
      beforeEach(function() {
        ['reply', 'replyAll', 'forward', 'markAsUnread', 'markAsRead', 'markAsFlagged', 'unmarkAsFlagged'].forEach(function(action) {
          inboxJmapItemService[action] = sinon.spy();
        });
      });

      it('should expose several functions to the element controller', function() {
        compileDirective('<inbox-message-list-item />');

        ['reply', 'replyAll', 'forward', 'markAsUnread', 'markAsRead', 'markAsFlagged', 'unmarkAsFlagged'].forEach(function(action) {
          element.controller('inboxMessageListItem')[action]();

          expect(inboxJmapItemService[action]).to.have.been.called;
        });
      });
    });

    describe('openEmail fn', function() {

      var $state, $stateParams, newComposerService;

      beforeEach(angular.mock.inject(function(_$state_, _$stateParams_, _newComposerService_) {
        $state = _$state_;
        $stateParams = _$stateParams_;
        newComposerService = _newComposerService_;

        $state.go = sinon.spy($state.go);
        $stateParams.mailbox = null;
      }));

      function openEmail(email) {
        return element.controller('inboxMessageListItem').openEmail(email);
      }

      it('should call newComposerService.openDraft if message is a draft', function() {
        newComposerService.openDraft = sinon.spy();

        compileDirective('<inbox-message-list-item />');
        openEmail({ id: 'id', isDraft: true });

        expect(newComposerService.openDraft).to.have.been.calledWith('id');
      });

      it('should change state to message view with $stateParams.mailbox parameter', function() {
        var email = { id: 'expectedId' };

        $stateParams.mailbox = '123';
        $scope.mailbox = { id: '456' };

        compileDirective('<inbox-message-list-item />');
        openEmail(email);

        expect($state.go).to.have.been.calledWith('.message', {
          emailId: 'expectedId',
          mailbox: $stateParams.mailbox,
          item: email
        });
      });

      it('should change state to $scope.mailbox.id if present and message is not a draft', function() {
        var email = { id: 'expectedId' };

        $scope.mailbox = { id: 'chosenMailbox' };
        compileDirective('<inbox-message-list-item />');
        openEmail(email);

        expect($state.go).to.have.been.calledWith('.message', {
          emailId: 'expectedId',
          mailbox: $scope.mailbox.id,
          item: email
        });
      });

      it('should change state to the first mailbox of the message if message is not a draft', function() {
        var email = { id: 'expectedId', mailboxIds: ['chosenMailbox', 'mailbox2'] };

        compileDirective('<inbox-message-list-item />');
        openEmail(email);

        expect($state.go).to.have.been.calledWith('.message', {
          emailId: 'expectedId',
          mailbox: 'chosenMailbox',
          item: email
        });
      });

    });

    describe('The moveToTrash function', function() {
      var controller;

      beforeEach(function() {
        $scope.item = {
          moveToMailboxWithRole: sinon.stub().returns($q.when())
        };

        $scope.groups = {
          addElement: sinon.spy(),
          removeElement: sinon.spy()
        };

        compileDirective('<inbox-message-list-item />');
        controller = element.controller('inboxMessageListItem');
      });

      it('should immediately remove message from the list', function() {
        controller.moveToTrash();
        expect($scope.groups.removeElement).to.have.been.calledWith($scope.item);
      });

      it('should move message to Trash folder using moveToMailboxWithRole method', function() {
        controller.moveToTrash();
        expect($scope.item.moveToMailboxWithRole).to.have.been.calledWith(jmap.MailboxRole.TRASH);
      });

      it('should add message to the list again on failure', function(done) {
        $scope.item.moveToMailboxWithRole = function() {return $q.reject(); };

        controller.moveToTrash().then(done.bind(null, 'should reject'), function() {
          expect($scope.groups.addElement).to.have.been.calledWith($scope.item);
          done();
        });

        $rootScope.$digest();
      });

    });

    describe('The swipe feature', function() {

      beforeEach(function() {
        $scope.item = {
          moveToMailboxWithRole: sinon.spy(function() {return $q.when();}),
          isUnread: true,
          setIsUnread: function(state) {
            this.isUnread = state;

            return $q.when();
          }
        };

        $scope.groups = {
          addElement: angular.noop,
          removeElement: angular.noop
        };
        compileDirective('<inbox-message-list-item />');
      });

      it('should use swipe directive as CSS class', function() {
        expect(element.find('.swipe').length).to.equal(1);
      });

      describe('The onSwipeRight fn', function() {

        it('should mark message as read by default feature flip', function(done) {
          $scope.onSwipeRight().then(function() {
            expect($scope.item.isUnread).to.be.false;
            done();
          });

          $rootScope.$digest();
        });

        it('should move message to Trash if feature flip is set to moveToTrash', function(done) {
          inboxConfigMock.swipeRightAction = 'moveToTrash';

          $scope.onSwipeRight().then(function() {
            expect($scope.item.moveToMailboxWithRole).to.have.been.calledWith(jmap.MailboxRole.TRASH);
            done();
          });

          $rootScope.$digest();
        });

      });

    });

    describe('The dragndrop feature', function() {

      it('should be draggable element', function() {
        compileDirective('<inbox-message-list-item />');

        expect(element.find('.clickable').attr('esn-draggable')).to.equal('esn-draggable');
      });

      it('should remove item from list on drag end with a drop', function() {
        compileDirective('<inbox-message-list-item />');

        $scope.item = 'an item';
        $scope.groups = {
          removeElement: sinon.spy()
        };

        $scope.onDragEnd(true);

        expect($scope.groups.removeElement).to.have.been.calledOnce;
        expect($scope.groups.removeElement).to.have.been.calledWith($scope.item);
      });

      it('should not remove item from list on drag end with no drop', function() {
        compileDirective('<inbox-message-list-item />');

        $scope.item = 'an item';
        $scope.groups = {
          removeElement: sinon.spy()
        };

        $scope.onDragEnd(false);

        expect($scope.groups.removeElement).to.have.been.callCount(0);
      });

      it('should add item back to the list on drop failure', function() {
        compileDirective('<inbox-message-list-item />');

        $scope.item = 'an item';
        $scope.groups = {
          addElement: sinon.spy()
        };

        $scope.onDropFailure();

        expect($scope.groups.addElement).to.have.been.calledOnce;
        expect($scope.groups.addElement).to.have.been.calledWith($scope.item);

      });

    });

  });

  describe('The inboxSwipeableListItem directive', function() {

    it('should expose leftTemplate to the scope', function() {
      inboxConfigMock.swipeRightAction = 'expectedAction';
      compileDirective('<div inbox-swipeable-list-item />');

      expect($scope.leftTemplate).to.equal('/unifiedinbox/views/partials/swipe/left-template-expectedAction.html');
    });

    describe('The onSwipeLeft fn', function() {

      it('should open action list, and keep swipe open', function() {
        var openFnSpy = sinon.spy();

        compileDirective('<div inbox-swipeable-list-item />', {
          $actionListController: {
            open: openFnSpy
          }
        });
        $scope.swipeClose = sinon.spy($scope.swipeClose);

        $scope.onSwipeLeft();

        expect(openFnSpy).to.have.been.calledWith();
        expect($scope.swipeClose).to.not.have.been.calledWith();
      });

      it('should close swipe when action list is closed', function() {
        compileDirective('<div inbox-swipeable-list-item />', {
          $actionListController: {
            open: function() {
              $scope.$emit('action-list.hide');
            }
          }
        });
        $scope.swipeClose = sinon.spy($scope.swipeClose);

        $scope.onSwipeLeft();

        expect($scope.swipeClose).to.have.been.calledWith();
      });

    });

  });

});
