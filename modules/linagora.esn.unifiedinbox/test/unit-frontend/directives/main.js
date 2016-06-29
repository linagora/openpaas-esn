'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The linagora.esn.unifiedinbox Main module directives', function() {

  var $compile, $rootScope, $scope, $timeout, element, jmapClient, jmap,
      iFrameResize = angular.noop, elementScrollService, $stateParams, $dropdown,
      isMobile, searchService, autosize, windowMock, fakeNotification, $state,
      sendEmailFakePromise, cancellationLinkAction, inboxConfigMock, inboxEmailService, _, INBOX_EVENTS, notificationFactory;

  beforeEach(function() {
    angular.module('esn.iframe-resizer-wrapper', []);

    angular.mock.module('esn.ui');
    angular.mock.module('esn.core');
    angular.mock.module('esn.session');
    angular.mock.module('esn.configuration');
    angular.mock.module('esn.dropdownList');
    angular.mock.module('linagora.esn.unifiedinbox');
    module('jadeTemplates');
  });

  beforeEach(module(function($provide) {
    isMobile = false;
    windowMock = {
      open: sinon.spy()
    };
    inboxConfigMock = {};

    $provide.constant('MAILBOX_ROLE_ICONS_MAPPING', {
      testrole: 'testclass',
      default: 'defaultclass'
    });
    jmapClient = {};
    $provide.constant('withJmapClient', function(callback) {
      return callback(jmapClient);
    });
    $provide.provider('iFrameResize', {
      $get: function() {
        return iFrameResize;
      }
    });
    $provide.value('elementScrollService', elementScrollService = {
      autoScrollDown: sinon.spy(),
      scrollDownToElement: sinon.spy()
    });
    $provide.value('$dropdown', $dropdown = sinon.spy());
    $provide.decorator('$window', function($delegate) {
      return angular.extend($delegate, windowMock);
    });
    $provide.value('Fullscreen', {});
    $provide.value('ASTrackerController', {});
    $provide.value('deviceDetector', { isMobile: function() { return isMobile;} });
    $provide.value('searchService', searchService = { searchRecipients: angular.noop });
    $provide.value('autosize', autosize = sinon.spy());
    $provide.value('inboxConfig', function(key, defaultValue) {
      return $q.when(angular.isDefined(inboxConfigMock[key]) ? inboxConfigMock[key] : defaultValue);
    });

    fakeNotification = { update: function() {}, setCancelAction: sinon.spy() };
    $provide.value('notifyService', function() { return fakeNotification; });
    $provide.value('sendEmail', sinon.spy(function() { return sendEmailFakePromise; }));
    $provide.decorator('newComposerService', function($delegate) {
      $delegate.open = sinon.spy(); // overwrite newComposerService.open() with a mock

      return $delegate;
    });
    $provide.decorator('$state', function($delegate) {
      $delegate.go = sinon.spy();

      return $delegate;
    });
  }));

  beforeEach(inject(function(_$compile_, _$rootScope_, _$timeout_, _$stateParams_, session, _inboxEmailService_, _$state_, _jmap_, ___, _INBOX_EVENTS_, _notificationFactory_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $timeout = _$timeout_;
    $stateParams = _$stateParams_;
    inboxEmailService = _inboxEmailService_;
    $state = _$state_;
    jmap = _jmap_;
    _ = ___;
    INBOX_EVENTS = _INBOX_EVENTS_;
    notificationFactory = _notificationFactory_;

    session.user = {
      preferredEmail: 'user@open-paas.org',
      emails: ['user@open-paas.org']
    };
  }));

  beforeEach(function() {
    $scope = $rootScope.$new();
  });

  afterEach(function() {
    if (element) {
      element.remove();
    }
  });

  function compileDirective(html, data) {
    element = angular.element(html);
    element.appendTo(document.body);

    if (data) {
      for (var key in data) {
        if (data.hasOwnProperty(key)) {
          element.data(key, data[key]);
        }
      }
    }

    $compile(element)($scope);
    $scope.$digest();

    return element;
  }

  describe('The newComposer directive', function() {

    var newComposerService;

    beforeEach(inject(function(_newComposerService_) {
      newComposerService = _newComposerService_;
    }));

    it('should call the open fn from newComposerService when clicked', function() {
      var testee = compileDirective('<div new-composer/>');

      newComposerService.open = sinon.spy();

      testee.click();

      expect(newComposerService.open).to.have.been.calledOnce;
    });

  });

  describe('The opInboxCompose directive', function() {

    var newComposerService, emailElement;

    beforeEach(inject(function(_newComposerService_) {
      newComposerService = _newComposerService_;
    }));

    it('should call the open fn when clicked on mailto link', function() {
      emailElement = compileDirective('<a ng-href="mailto:SOMEONE" op-inbox-compose op-inbox-compose-display-name="SOMETHING"/>');
      newComposerService.open = sinon.spy();

      emailElement.click();
      expect(newComposerService.open).to.have.been.calledWith({
        to:[{
          email: 'SOMEONE',
          name: 'SOMETHING'
        }]
      });
    });

    it('should call the open fn when put email in opInboxCompose attribute', function() {
      emailElement = compileDirective('<a op-inbox-compose="SOMEONE" op-inbox-compose-display-name="SOMETHING"/>');
      newComposerService.open = sinon.spy();

      emailElement.click();
      expect(newComposerService.open).to.have.been.calledWith({
        to:[{
          email: 'SOMEONE',
          name: 'SOMETHING'
        }]
      });
    });

    it('should call the preventDefault and stopPropagation fn when clicked on mailto link', function() {
      emailElement = compileDirective('<a op-inbox-compose ng-href="mailto:SOMEONE" op-inbox-compose-display-name="SOMETHING"/>');
      var event = {
        type: 'click',
        preventDefault: sinon.spy(),
        stopPropagation: sinon.spy()
      };

      emailElement.trigger(event);

      expect(event.preventDefault).to.have.been.called;
      expect(event.stopPropagation).to.have.been.called;
    });

    it('should not call the open fn when the link does not contain mailto', function() {
      emailElement = compileDirective('<a ng-href="tel:SOMEONE"/>');
      newComposerService.open = sinon.spy();

      emailElement.click();

      expect(newComposerService.open).to.have.not.been.called;
    });

    it('should not call the open fn when the link does not mailto and opInboxCompose attribute is undefined', function() {
      emailElement = compileDirective('<a op-inbox-compose />');
      newComposerService.open = sinon.spy();

      emailElement.click();

      expect(newComposerService.open).to.have.not.been.called;
    });

    it('should not call the open fn when the link does not mailto and opInboxCompose attribute is default', function() {
      emailElement = compileDirective('<a op-inbox-compose="op-inbox-compose" />');
      newComposerService.open = sinon.spy();

      emailElement.click();

      expect(newComposerService.open).to.have.not.been.called;
    });

    it('should call the open fn with correct email', function() {
      emailElement = compileDirective('<a ng-href="mailto:SOMEONE" op-inbox-compose="SOMEBODY" />');
      newComposerService.open = sinon.spy();

      emailElement.click();

      expect(newComposerService.open).to.have.been.calledWith({
        to:[{
          email: 'SOMEONE',
          name: 'SOMEONE'
        }]
      });
    });

    it('should it should use the email address as the display name if display name is not defined', function() {
      emailElement = compileDirective('<a op-inbox-compose ng-href="mailto:SOMEONE"/>');
      newComposerService.open = sinon.spy();

      emailElement.click();

      expect(newComposerService.open).to.have.been.calledWith({
        to:[{
          email: 'SOMEONE',
          name: 'SOMEONE'
        }]
      });
    });

    it('should call the open fn when clicked on mailto link with multiple mails', function() {
      emailElement = compileDirective('<a ng-href="mailto:SOMEONE1,SOMEONE2,SOMEONE3" op-inbox-compose/>');
      newComposerService.open = sinon.spy();

      emailElement.click();
      expect(newComposerService.open).to.have.been.calledWith({
        to:[{
          email: 'SOMEONE1',
          name: 'SOMEONE1'
        },
        {
          email: 'SOMEONE2',
          name: 'SOMEONE2'
        },
        {
          email: 'SOMEONE3',
          name: 'SOMEONE3'
        }]
      });
    });
  });

  describe('The mailboxDisplay directive', function() {

    it('should define $scope.mailboxIcons to default value if mailbox has no role', function() {
      $scope.mailbox = {
        role: {
          value: null
        }
      };
      compileDirective('<mailbox-display mailbox="mailbox" />');

      expect(element.isolateScope().mailboxIcons).to.equal('defaultclass');
    });

    it('should define $scope.mailboxIcons to the correct value when mailbox has a role', function() {
      $scope.mailbox = {
        role: {
          value: 'testrole'
        }
      };
      compileDirective('<mailbox-display mailbox="mailbox" />');

      expect(element.isolateScope().mailboxIcons).to.equal('testclass');
    });

    describe('The dragndrop feature', function() {

      var isolateScope;

      beforeEach(function() {
        $scope.mailbox = {
          id: '1',
          role: {
            value: 'testrole'
          }
        };
        compileDirective('<mailbox-display mailbox="mailbox" />');

        isolateScope = element.isolateScope();
      });

      it('should be droppable element', function() {
        expect(element.attr('esn-droppable')).to.equal('esn-droppable');
      });

      describe('The onDrop function', function() {
        var inboxThreadService, inboxEmailService;

        beforeEach(inject(function(_inboxThreadService_, _inboxEmailService_) {
          inboxThreadService = _inboxThreadService_;
          inboxEmailService = _inboxEmailService_;

          inboxThreadService.moveToMailbox = sinon.spy();
          inboxEmailService.moveToMailbox = sinon.spy();
        }));

        it('should move thread to mailbox if dragData is a thread', function() {
          var thread = {
            messageIds: ['m1'],
            email: {
              mailboxIds: ['2']
            }
          };

          isolateScope.onDrop(thread);

          expect(inboxThreadService.moveToMailbox).to.have.been.calledOnce;
          expect(inboxThreadService.moveToMailbox).to.have.been.calledWith(thread, $scope.mailbox);
        });

        it('should move message to mailbox if dragData is a message', function() {
          var message = {
            id: 'm1',
            mailboxIds: ['2']
          };

          isolateScope.onDrop(message);

          expect(inboxEmailService.moveToMailbox).to.have.been.calledOnce;
          expect(inboxEmailService.moveToMailbox).to.have.been.calledWith(message, $scope.mailbox);
        });

      });

      describe('The isDropZone function', function() {

        var mailboxesService;

        beforeEach(inject(function(_mailboxesService_) {
          mailboxesService = _mailboxesService_;
          mailboxesService.canMoveMessage = sinon.spy();
        }));

        it('should check result from mailboxesService.canMoveMessage if $dragData is thread', function() {
          var thread = {
            messageIds: ['m1'],
            email: {
              mailboxIds: ['2']
            }
          };

          isolateScope.isDropZone(thread);

          expect(mailboxesService.canMoveMessage).to.have.been.calledOnce;
          expect(mailboxesService.canMoveMessage).to.have.been.calledWith(thread.email);
        });

        it('should check result from mailboxesService.canMoveMessage if $dragData is message', function() {
          var message = {
            mailboxIds: ['2']
          };

          isolateScope.isDropZone(message);

          expect(mailboxesService.canMoveMessage).to.have.been.calledOnce;
          expect(mailboxesService.canMoveMessage).to.have.been.calledWith(message);
        });
      });

    });

  });

  describe('The composer directive', function() {

    var $state, $stateParams;

    beforeEach(inject(function(_$state_, _$stateParams_) {
      $state = _$state_;
      $stateParams = _$stateParams_;
    }));

    it('should return false when isBoxed is called', function() {
      compileDirective('<composer />');

      expect($scope.isBoxed()).to.equal(false);
    });

    it('should call state.go with the given type and the controller composition', function(done) {
      var directive = compileDirective('<composer />');

      directive.controller('composer').initCtrl({});

      $state.go = sinon.spy(function(recipientsType, params) {
        expect(recipientsType).to.equal('.recipients');
        expect(params).to.shallowDeepEqual({
          recipientsType: 'to',
          composition: {
            draft: { originalEmailState: { bcc: [], cc: [], to: [] } },
            email: { bcc: [], cc: [], to: [] }
          }
        });
        done();
      });

      $scope.openRecipients('to');
    });

    describe('its controller', function() {

      var directive, ctrl;

      beforeEach(function() {
        $stateParams.previousState = {
          name: 'previousStateName',
          params: 'previousStateParams'
        };
        directive = compileDirective('<composer />');
        ctrl = directive.controller('composer');
        ctrl.saveDraft = sinon.spy();
        $state.go = sinon.spy();
      });

      it('should save draft when state has successfully changed', function() {
        $rootScope.$broadcast('$stateChangeSuccess');

        expect(ctrl.saveDraft).to.have.been.calledOnce;
      });

      it('should not save draft when state has successfully changed to a state with ignoreSaveAsDraft=true', function() {
        $rootScope.$broadcast('$stateChangeSuccess', { data: { ignoreSaveAsDraft: true } });

        expect(ctrl.saveDraft).to.have.not.been.calledWith();
      });

      it('should disable the listener when state has successfully changed to a state with ignoreSaveAsDraft=true', function() {
        $rootScope.$broadcast('$stateChangeSuccess', { data: { ignoreSaveAsDraft: true } });
        $rootScope.$broadcast('$stateChangeSuccess');

        expect(ctrl.saveDraft).to.have.not.been.calledWith();
      });

      it('should save draft only once when close is called, then location has successfully changed', function() {
        $scope.close();
        $rootScope.$broadcast('$stateChangeSuccess');

        expect(ctrl.saveDraft).to.have.been.calledOnce;
      });

      it('should save draft when the composer is closed', function() {
        $scope.close();

        expect(ctrl.saveDraft).to.have.been.calledOnce;
      });

      it('should back to previous state with correct parameters when the composer is closed', function() {
        $scope.close();
        expect($state.go).to.have.been.calledOnce;
        expect($state.go).to.have.been.calledWith('previousStateName', 'previousStateParams');
      });

      it('should not save a draft when the composer is hidden', function() {
        $scope.hide();

        expect(ctrl.saveDraft).to.have.not.been.called;
      });

      it('should back to previous state with correct parameters when the composer is hidden', function() {
        $scope.hide();

        expect($state.go).to.have.been.calledOnce;
        expect($state.go).to.have.been.calledWith('previousStateName', 'previousStateParams');
      });

      function sendDraftWhileOffline(email) {
        sendEmailFakePromise = $q.reject(new Error('Cannot send'));
        directive = compileDirective('<composer />');
        ctrl = directive.controller('composer');
        ctrl.initCtrl(email);

        $scope.send();
        $scope.$digest();
      }

      it('should notify of error featuring a resume action when sending offline', function() {
        var aFakeEmail = {
          to: [{ name: 'bob@example.com', email: 'bob@example.com'}], cc:[], bcc:[],
          subject: 'le sujet', htmlBody: '<p>Le contenu</p>'
        };

        sendDraftWhileOffline(aFakeEmail);

        expect(fakeNotification.setCancelAction).to.have.been.calledWithMatch(sinon.match({
          action: sinon.match.func,
          linkText: 'Reopen the composer'
        }));
      });

      it('should reopen composer when resuming after sending failed', inject(function(newComposerService) {
        var aFakeEmail = {
          to: [{ name: 'bob@example.com', email: 'bob@example.com'}], cc:[], bcc:[],
          subject: 'le sujet', htmlBody: '<p>Le contenu</p>'
        };

        sendDraftWhileOffline(aFakeEmail);

        cancellationLinkAction = fakeNotification.setCancelAction.getCalls()[0].args[0].action;
        // act
        cancellationLinkAction();
        // assert
        expect(newComposerService.open).to.have.been.calledWithMatch(
          aFakeEmail,
          'Resume message composition'
        );
      }));
    });

    describe('The mobile header buttons', function() {

      var mainHeader, ctrl;

      beforeEach(inject(function() {

        ctrl = compileDirective('<composer/>').controller('composer');
        ctrl.saveDraft = angular.noop;
        mainHeader = compileDirective('<main-header/>');
      }));

      it('should bind the send button to the scope method', function() {
        $scope.send = sinon.spy();

        mainHeader.find('.inbox-subheader .send').click();

        expect($scope.send).to.have.been.called;
      });

      it('should bind the close button to the scope method', function() {
        $scope.close = sinon.spy();

        mainHeader.find('.inbox-subheader .close.button').click();

        expect($scope.close).to.have.been.called;
      });
    });

    describe('The editQuotedMail function', function() {

      function expectFocusAt(position) {
        var textarea = element.find('.compose-body').get(0);

        expect(document.activeElement).to.equal(textarea);
        expect(textarea.selectionStart).to.equal(position);
        expect(textarea.selectionEnd).to.equal(position);
      }

      beforeEach(inject(function($templateCache, emailBodyService) {
        isMobile = true;
        autosize.update = sinon.spy();

        emailBodyService.bodyProperty = 'textBody';

        $templateCache.put('/unifiedinbox/views/partials/quotes/default.txt', '{{ email.textBody }} Quote {{ email.quoted.textBody }}');
      }));

      beforeEach(function() {
        $stateParams.email = {
          to: [],
          cc: [],
          bcc: []
        };

        $stateParams.previousState = {
          name: 'unifiedinbox.inbox',
          params: {}
        };
      });

      afterEach(function() {
        delete $stateParams.email;
      });

      it('should quote the original message, and set it as the textBody', function(done) {
        compileDirective('<composer />');
        $scope.email = {
          quoted: {
            textBody: 'Hello'
          }
        };

        $scope.editQuotedMail().then(function() {
          expect($scope.email.isQuoting).to.equal(true);
          expect($scope.email.textBody).to.equal(' Quote Hello');

          done();
        });
        $rootScope.$digest();
      });

      it('should scroll the viewport down to the email body (.compose-body)', function() {
        compileDirective('<composer />');
        $scope.email = {
          quoted: {
            textBody: 'Hello'
          }
        };

        $scope.editQuotedMail();
        $rootScope.$digest();
        $timeout.flush();

        expect(elementScrollService.scrollDownToElement).to.have.been.calledWith(sinon.match({
          selector: '.compose-body'
        }));
      });

      it('should focus the email body, at the very beginning if there was no text already', function() {
        compileDirective('<composer />');
        $scope.email = {
          quoted: {
            textBody: 'Hello'
          }
        };

        $scope.editQuotedMail();
        $rootScope.$digest();
        $timeout.flush();

        expectFocusAt(0);
      });

      it('should focus the email body, after an already typed text if present', function() {
        compileDirective('<composer />');
        $scope.email = {
          textBody: 'I am 18 chars long',
          quoted: {
            textBody: 'Hello'
          }
        };

        $scope.editQuotedMail();
        $rootScope.$digest();
        $timeout.flush();

        expectFocusAt(18);
      });

      it('should update autosize() on the email body', function() {
        compileDirective('<composer />');

        $scope.editQuotedMail();
        $rootScope.$digest();
        $timeout.flush();

        expect(autosize.update).to.have.been.calledWith(element.find('.compose-body').get(0));
      });

      it('should not save a draft if the user\'s only change is a press on Edit Quoted Mail', function() {
        jmapClient.saveAsDraft = sinon.spy();
        $state.go = angular.noop;

        compileDirective('<composer />');
        $scope.editQuotedMail();
        $rootScope.$digest();
        $timeout.flush();

        $scope.close();
        $rootScope.$digest();

        expect(jmapClient.saveAsDraft.callCount).to.equal(0);
      });

      it('should still save a draft if the user changes body then presses on Edit Quoted Mail', function() {
        jmapClient.saveAsDraft = sinon.spy(function() {
          return $q.when({});
        });
        $state.go = angular.noop;

        compileDirective('<composer />');
        $scope.email.textBody = 'the user has written this';
        $scope.editQuotedMail();
        $rootScope.$digest();
        $timeout.flush();

        $scope.close();
        $rootScope.$digest();

        expect(jmapClient.saveAsDraft.callCount).to.equal(1);
      });

      it('should still save a draft if the user changes recipients then presses on Edit Quoted Mail', function() {
        jmapClient.saveAsDraft = sinon.spy(function() {
          return $q.when({});
        });
        $state.go = angular.noop;

        compileDirective('<composer />');
        $scope.email.to = [{
          email: 'SOMEONE',
          name: 'SOMEONE'
        }];
        $scope.editQuotedMail();
        $rootScope.$digest();
        $timeout.flush();

        $scope.close();
        $rootScope.$digest();

        expect(jmapClient.saveAsDraft.callCount).to.equal(1);
      });

    });

  });

  describe('The composer-desktop directive', function() {

    it('should return true when isBoxed is called', function() {
      compileDirective('<composer-desktop />');

      expect($scope.isBoxed()).to.equal(true);
    });

    it('should save draft when the composer is destroyed', function() {
      var ctrl = compileDirective('<composer-desktop />').controller('composerDesktop');

      ctrl.saveDraft = sinon.spy();

      $scope.$emit('$destroy');

      expect(ctrl.saveDraft).to.have.been.called;
    });

    it('should delegate the hide fn to the box\'s $hide fn', function() {
      $scope.$hide = sinon.spy();
      compileDirective('<composer-desktop />');

      $scope.hide();

      expect($scope.$hide).to.have.been.called;
    });

    it('should initialize the controller with expected compositionOptions', function() {
      $scope.compositionOptions = { expected: 'options' };
      var controller = compileDirective('<composer-desktop/>').controller('composerDesktop');

      controller.initCtrl = sinon.spy();
      $timeout.flush();

      expect(controller.initCtrl).to.have.been.calledWith(sinon.match.any, { expected: 'options' });
    });

    it('should initialize the controller with summernote\'s initial value when composing from scratch', function() {
      var controller = compileDirective('<composer-desktop/>').controller('composerDesktop');

      controller.initCtrl = sinon.spy();
      $timeout.flush();

      expect(controller.initCtrl).to.have.been.calledWith(sinon.match({
        htmlBody: ''
      }));
    });

    it('should initialize the controller with summernote\'s initial value when composing from an existing email', function() {
      var controller;

      $scope.email = {
        htmlBody: '<p><br /></p>Hey'
      };
      controller = compileDirective('<composer-desktop/>').controller('composerDesktop');

      controller.initCtrl = sinon.spy();
      $timeout.flush();

      expect(controller.initCtrl).to.have.been.calledWith(sinon.match({
        htmlBody: '<p><br></p>Hey' // Bogus <br> !
      }));
    });

    it('should expose an onInit function to the scope', function() {
      compileDirective('<composer-desktop />');

      expect($scope.onInit).to.be.a('function');
    });

    it('should add a new composer-desktop-attachments element', function() {
      expect(compileDirective('<composer-desktop />').find('composer-attachments')).to.have.length(1);
    });

  });

  /**
   * PhantomJS does not work fine with iFrame and 'load' events, thus the .skip()
   * Tests run under Chrome and Firefox, though...
   */
  describe('The htmlEmailBody directive', function() {

    beforeEach(function() {
      $scope.email = {
        htmlBody: '<html><body><div>Hey, I am the email body !</div></body></html>'
      };
    });

    it('should contain an iframe element', function() {
      compileDirective('<html-email-body email="email" />');

      expect(element.find('iframe')).to.have.length(1);
    });

    it.skip('should enable iFrame resizer on the iFrame', function(done) {
      iFrameResize = function(options) {
        expect(options).to.shallowDeepEqual({
          checkOrigin: false,
          scrolling: true,
          inPageLinks: true,
          resizedCallback: function() {}
        });

        done();
      };
      compileDirective('<html-email-body email="email" />');
    });

    it('should invoke iFrameResizer.resize when it receives an email:collapse event', function(done) {
      iFrameResize = function() {
        return [{
          iFrameResizer: {
            resize: done
          }
        }];
      };

      compileDirective('<html-email-body email="email" />');
      $rootScope.$broadcast('iframe:loaded', {
        contentWindow: {
          postMessage: angular.noop
        }
      });
      $rootScope.$broadcast('email:collapse');
      $timeout.flush();
    });

    it('should post html content after having filtered it with inlineImages then loadImagesAsync filters', function(done) {
      $scope.email = {
        htmlBody: '<html><body><img src="remote.png" /><img src="cid:1" /></body></html>',
        attachments: [{ cid: '1', url: 'http://expected-url' }]
      };

      compileDirective('<html-email-body email="email" />');
      $rootScope.$broadcast('iframe:loaded', {
        contentWindow: {
          postMessage: function(content, target) {
            expect(target).to.equal('*');

            var contentWithoutRandomPort = content.replace(/localhost:\d*/g, 'localhost:PORT');

            expect(contentWithoutRandomPort).to.equal(
              '[linagora.esn.unifiedinbox.changeDocument]<html><body>' +
                '<img src="http://localhost:PORT/images/throbber-amber.svg" data-async-src="remote.png" />' +
                '<img src="http://localhost:PORT/images/throbber-amber.svg" data-async-src="http://expected-url" />' +
              '</body></html>');

            done();
          }
        }
      });
    });

  });

  describe('The inboxFab directive', function() {

    var boxOverlayService, newComposerService;

    beforeEach(inject(function(_boxOverlayService_, _newComposerService_) {
      boxOverlayService = _boxOverlayService_;
      newComposerService = _newComposerService_;
    }));

    function findInnerFabButton(fab) {
      return angular.element(fab.children('button')[0]);
    }

    function expectFabToBeEnabled(button) {
      $scope.$digest();
      expect($scope.isDisabled).to.equal(false);
      expect(button.hasClass('btn-accent')).to.equal(true);
      expect(button.attr('disabled')).to.not.match(/disabled/);
    }

    function expectFabToBeDisabled(button) {
      $scope.$digest();
      expect($scope.isDisabled).to.equal(true);
      expect(button.hasClass('btn-accent')).to.equal(false);
      expect(button.attr('disabled')).to.match(/disabled/);
    }

    function compileFabDirective() {
      var fab = compileDirective('<inbox-fab></inbox-fab>');

      $timeout.flush();

      return findInnerFabButton(fab);
    }

    it('should have enabled button when space left on screen when linked', function() {
      boxOverlayService.spaceLeftOnScreen = function() {return true;};

      var button = compileFabDirective();

      expectFabToBeEnabled(button);
    });

    it('should have disabled button when no space left on screen when linked', function() {
      boxOverlayService.spaceLeftOnScreen = function() {return false;};

      var button = compileFabDirective();

      expectFabToBeDisabled(button);
    });

    it('should disable the button when no space left on screen', function() {
      var button = compileFabDirective();

      $scope.$emit('box-overlay:no-space-left-on-screen');

      expectFabToBeDisabled(button);
    });

    it('should enable the button when new space left on screen', function() {
      var button = compileFabDirective();

      $scope.$emit('box-overlay:no-space-left-on-screen');
      $scope.$emit('box-overlay:space-left-on-screen');

      expectFabToBeEnabled(button);
    });

    it('should change location when the compose fn is called', function() {
      newComposerService.open = sinon.spy();
      var fab = compileFabDirective();

      fab.click();

      expect(newComposerService.open).to.have.been.calledOnce;
    });
  });

  describe('The recipientsAutoComplete directive', function() {

    function compileDirectiveThenGetScope() {
      compileDirective('<div><recipients-auto-complete ng-model="model" template="recipients-auto-complete"></recipients-auto-complete></div>', {
        $composerController: {
          search: {}
        }
      });

      return element.find('recipients-auto-complete').isolateScope();
    }

    it('should trigger an error if no template is given', function() {
      expect(function() {
        compileDirective('<div><recipients-auto-complete ng-model="model"></recipients-auto-complete></div>');
      }).to.throw(Error, 'This directive requires a template attribute');
    });

    it('should bring up email keyboard when editing', function() {
      compileDirective('<div><recipients-auto-complete ng-model="model" template="recipients-auto-complete"></recipients-auto-complete></div>');
      var recipientInput = element.find('recipients-auto-complete tags-input');

      expect(recipientInput.attr('type')).to.equal('email');
    });

    it('should bring up email keyboard when editing using fullscreen template', function() {
      compileDirective('<div><recipients-auto-complete ng-model="model" template="fullscreen-recipients-auto-complete"></recipients-auto-complete></div>');
      var recipientInput = element.find('recipients-auto-complete tags-input');

      expect(recipientInput.attr('type')).to.equal('email');
    });

    it('should define $scope.search from searchService.searchRecipients', function(done) {
      searchService.searchRecipients = function() { done(); };
      compileDirective('<div><recipients-auto-complete ng-model="model" template="recipients-auto-complete"></recipients-auto-complete></div>', {
        $composerController: {}
      });

      element.find('recipients-auto-complete').isolateScope().search();
    });

    it('should define $scope.search from the composerDesktop directive controller', function(done) {
      searchService.searchRecipients = function() { done(); };
      compileDirective('<div><recipients-auto-complete ng-model="model" template="recipients-auto-complete"></recipients-auto-complete></div>', {
        $composerDesktopController: {}
      });

      element.find('recipients-auto-complete').isolateScope().search();
    });

    it('should scrolldown element when a tag is added and broadcast an event to inform the fullscreen-edit-form to scrolldown', function() {
      var scope = compileDirectiveThenGetScope();
      var recipient = {displayName: 'user@domain'};

      scope.onTagAdded(recipient);

      expect(elementScrollService.autoScrollDown).to.have.been.calledWith();
    });

    it('should accept to add a new tag if email does not matche the email of an existing tag', function() {
      var scope = compileDirectiveThenGetScope();

      scope.tags.push({ email: 'user@domain' });
      scope.tags.push({ email: 'user2@domain' });
      scope.tags.push({ email: 'user3@domain' });

      expect(scope.onTagAdding({ email: 'user0@domain' })).to.equal(true);
    });

    it('should refuse to add a new tag if email matches the email of an existing tag', function() {
      var scope = compileDirectiveThenGetScope();

      scope.tags.push({ email: 'user@domain' });
      scope.tags.push({ email: 'user2@domain' });
      scope.tags.push({ email: 'user3@domain' });

      expect(scope.onTagAdding({ email: 'user2@domain' })).to.equal(false);
    });

    it('should remove all fields that are not "email" or "name"', function() {
      var scope = compileDirectiveThenGetScope();
      var recipient = {
        other: 'unexpected',
        name: 'The display name field',
        displayName: 'will be discarded',
        email: 'user@domain',
        not: 'expected'
      };

      scope.onTagAdding(recipient);

      expect(recipient).to.deep.equal({
        name: 'The display name field',
        email: 'user@domain'
      });
    });

    it('should make sure "email" is defined', function() {
      var scope = compileDirectiveThenGetScope(),
          recipient = { name: 'a@a.com' };

      scope.onTagAdding(recipient);

      expect(recipient).to.deep.equal({ name: 'a@a.com', email: 'a@a.com' });
    });

    it('should initialize the model if none given', function() {
      expect(compileDirectiveThenGetScope().tags).to.deep.equal([]);
    });

    it('should use the model if one given', function() {
      $scope.model = [{ a: '1' }];

      expect(compileDirectiveThenGetScope().tags).to.deep.equal([{ a: '1' }]);
    });

  });

  describe('The emailBodyEditor', function() {

    it('should load summernote when isMobile()=false', function() {
      expect(compileDirective('<email-body-editor />').find('.summernote')).to.have.length(1);
    });

    it('should load a textarea when isMobile()=true', function() {
      isMobile = true;

      var element = compileDirective('<email-body-editor />');

      expect(element.find('textarea')).to.have.length(1);
      expect(element.find('.summernote')).to.have.length(0);
    });

  });

  describe('The email directive', function() {

    it('should show reply button and hide replyAll button if email.hasReplyAll is false', function() {
      $scope.email = { id: 'id', hasReplyAll: false };
      compileDirective('<email email="email"/>');

      expect(element.find('.mdi-reply').length).to.equal(1);
      expect(element.find('.mdi-reply-all').length).to.equal(0);
    });

    it('should hide reply button and show replyAll button if email.hasReplyAll is true', function() {
      $scope.email = { id: 'id', hasReplyAll: true };
      compileDirective('<email email="email"/>');

      expect(element.find('.mdi-reply').length).to.equal(0);
      expect(element.find('.mdi-reply-all').length).to.equal(1);
    });

    it('should escape HTML in plain text body', function() {
      $scope.email = {
        id: 'id',
        textBody: 'Body <i>with</i> weird <hu>HTML</hu>'
      };
      compileDirective('<email email="email"/>');

      expect(element.find('.email-body').html()).to.contain('Body &lt;i&gt;with&lt;/i&gt; weird &lt;hu&gt;HTML&lt;/hu&gt;');
    });

    it('should autolink links in plain text body', function() {
      $scope.email = {
        id: 'id',
        textBody: 'Body with me@open-paas.org and open-paas.org'
      };
      compileDirective('<email email="email"/>');

      expect(element.find('.email-body a[href="http://open-paas.org"]')).to.have.length(1);
      expect(element.find('.email-body a[href="mailto:me@open-paas.org"]')).to.have.length(1);
    });

    describe('The markAsUnread fn', function() {
      it('should mark email as unread then update location to parent state', inject(function($state) {
        $scope.email = { setIsUnread: sinon.stub().returns($q.when()) };
        $state.go = sinon.spy();
        compileDirective('<email email="email" />');

        element.controller('email').markAsUnread();
        $scope.$digest();

        expect($state.go).to.have.been.calledWith('^');
        expect($scope.email.setIsUnread).to.have.been.calledWith(true);
      }));
    });

    describe('The moveToTrash fn', function() {
      it('should delete the email then update location to parent state if the email is deleted successfully', function() {
        inboxEmailService.moveToTrash = sinon.spy(function() {
          return $q.when({});
        });
        compileDirective('<email/>');

        element.controller('email').moveToTrash();
        $scope.$digest();

        expect($state.go).to.have.been.calledWith('^');
        expect(inboxEmailService.moveToTrash).to.have.been.called;
      });

      it('should not update location if the email is not deleted', function() {
        inboxEmailService.moveToTrash = sinon.spy(function() {
          return $q.reject({});
        });
        compileDirective('<email/>');

        element.controller('email').moveToTrash();
        $scope.$digest();

        expect($state.go).to.have.not.been.called;
        expect(inboxEmailService.moveToTrash).to.have.been.called;
      });
    });

    describe('The toggleIsCollapsed function', function() {

      it('should do nothing if email.isCollapsed is not defined', function() {
        var email = {}, spyFn = sinon.spy();

        var element = compileDirective('<email />');
        var scope = element.isolateScope();

        scope.$on('email:collapse', function() {
          spyFn();
        });

        element.controller('email').toggleIsCollapsed(email);

        expect(email.isCollapsed).to.be.undefined;
        expect(spyFn).to.not.have.been.called;
      });

      it('should toggle the email.isCollapsed attribute', function() {
        var email = {
          isCollapsed: true
        };

        compileDirective('<email />').controller('email').toggleIsCollapsed(email);
        expect(email.isCollapsed).to.equal(false);
      });

      it('should broadcast email:collapse event with the email.isCollapsed as data', function(done) {
        var email = {
          isCollapsed: true
        };

        var element = compileDirective('<email />');
        var scope = element.isolateScope();

        // eslint-disable-next-line no-unused-vars
        scope.$on('email:collapse', function(event, data) {
          expect(data).to.equal(false);
          done();
        });

        element.controller('email').toggleIsCollapsed(email);
      });
    });

  });

  describe('The inboxStar directive', function() {

    describe('The setIsFlagged function', function() {

      it('should call item.setIsFlagged, passing the flag', function(done) {
        $scope.email = {
          setIsFlagged: function(state) {
            expect(state).to.equal(true);

            done();
          }
        };

        compileDirective('<inbox-star item="email" />').controller('inboxStar').setIsFlagged(true);
      });

    });

  });

  describe('The inboxAttachment directive', function() {

    it('should call $window.open once clicked', function() {
      $scope.attachment = {
        url: 'url'
      };

      compileDirective('<inbox-attachment attachment="attachment"/>').click();

      expect(windowMock.open).to.have.been.calledWith('url');
    });

  });

  describe('The inboxFilterButton directive', function() {
    var scope, controller;

    beforeEach(function() {
      $scope.filters = [
        {id: 'filter_1', displayName: 'display filter 1'},
        {id: 'filter_2', displayName: 'display filter 2'},
        {id: 'filter_3', displayName: 'display filter 3'}
      ];

      element = compileDirective('<inbox-filter-button filters="filters"/>');
      scope = element.isolateScope();
      controller = element.controller('inboxFilterButton');
    });

    it('should init the scope with the required attributes', function() {
      expect(scope.dropdownList).to.deep.equal({
        placeholder: 'Filters',
        filtered: false
      });
    });

    it('should keep the checked filter and indicate set filtered to true', function() {
      $scope.filters = [
        {id: 'filter_1', displayName: 'display filter 1', checked: true},
        {id: 'filter_2', displayName: 'display filter 2'},
        {id: 'filter_3', displayName: 'display filter 3', checked: true}
      ];
      scope = compileDirective('<inbox-filter-button filters="filters"/>').isolateScope();

      expect(scope.dropdownList.filtered).to.be.true;
      expect(_.map($scope.filters, 'checked')).to.deep.equal([true, undefined, true]);
      expect(scope.dropdownList.placeholder).to.equal('2 selected');
    });

    it('should leverage the placeholder attribute as the default placeholder once passed', function() {
      scope = compileDirective('<inbox-filter-button filters="filters" placeholder="my placeholder"/>').isolateScope();

      expect(scope.dropdownList.placeholder).to.equal('my placeholder');
    });

    it('should call the $dropdown service once clicked', function() {
      element.find('.filter-button').click();

      expect($dropdown).to.have.been.calledOnce;
    });

    it('should set the dropdownList as filtered when at least one filter is checked', function() {
      scope.filters[0].checked = true;
      controller.dropdownItemClicked();

      expect(scope.dropdownList.filtered).to.be.true;
    });

    it('should set the placeholder to the filter\'s displayName when only one filter is checked', function() {
      scope.filters[0].checked = true;
      controller.dropdownItemClicked();

      expect(scope.dropdownList.placeholder).to.equal('display filter 1');
    });

    it('should set the placeholder to the * selected when several filters are checked', function() {
      scope.filters[0].checked = true;
      scope.filters[1].checked = true;
      controller.dropdownItemClicked();

      expect(scope.dropdownList.placeholder).to.equal('2 selected');
    });

    it('should refresh the dropdown when inbox.filterChanged event is broadcasted', function() {
      scope.filters[0].checked = true;
      scope.filters[1].checked = true;
      $rootScope.$broadcast(INBOX_EVENTS.FILTER_CHANGED);

      expect(scope.dropdownList.placeholder).to.equal('2 selected');
    });

  });

  describe('The composerAttachments directive', function() {

    it('should focus the body when clicked, on desktop', function() {
      compileDirective('<composer-desktop />');

      element.find('.attachments-zone').click();
      $timeout.flush();

      expect(document.activeElement).to.equal(element.find('.note-editable').get(0));
    });

    it('should focus the body when clicked, on mobile', function() {
      isMobile = true;
      compileDirective('<composer />');

      element.find('.attachments-zone').click();
      $timeout.flush();

      expect(document.activeElement).to.equal(element.find('textarea.compose-body').get(0));
    });

    it('should not focus the body when an attachment is removed', function() {
      $stateParams.composition = {
        saveDraftSilently: sinon.spy(),
        getEmail: sinon.stub().returns({
          attachments: [{
            blobId: '1',
            upload: {
              cancel: angular.noop
            }
          }]
        })
      };
      compileDirective('<composer-desktop />');

      element.find('.attachment[name="attachment-0"] .cancel').click();
      $timeout.flush();

      expect($scope.email.attachments).to.deep.equal([]);
      expect(document.activeElement).to.not.equal(element.find('.note-editable').get(0));
    });

    it('should not focus the body when an attachment upload is retried', function() {
      $scope.email = {
        attachments: [{
          blobId: '1',
          status: 'error',
          upload: {
            cancel: angular.noop
          }
        }]
      };
      compileDirective('<composer-desktop />');

      element.find('.attachment[name="attachment-0"] .retry').click();
      $timeout.flush();

      expect(document.activeElement).to.not.equal(element.find('.note-editable').get(0));
    });

  });

  describe('The inboxEmailFooter directive', function() {

    it('should hide replyAll button if email.hasReplyAll is false', function() {
      $scope.email = { id: 'id', hasReplyAll: false };
      compileDirective('<inbox-email-footer email="email"/>');

      expect(element.find('.mdi-reply-all').length).to.equal(0);
    });

    it('should show replyAll button if email.hasReplyAll is true', function() {
      $scope.email = { id: 'id', hasReplyAll: true };
      compileDirective('<inbox-email-footer email="email"/>');

      expect(element.find('.mdi-reply-all').length).to.equal(1);
    });

    describe('its controller', function() {
      var controller;

      beforeEach(function() {
        $scope.email = { id: 'id' };
        compileDirective('<inbox-email-footer email="email"/>');
        controller = element.controller('inboxEmailFooter');
      });

      it('should expose a "reply" function', function() {
        inboxEmailService.reply = sinon.spy();

        controller.reply();

        expect(inboxEmailService.reply).to.have.been.calledWith($scope.email);
      });

      it('should expose a "replyAll" function', function() {
        inboxEmailService.replyAll = sinon.spy();

        controller.replyAll();

        expect(inboxEmailService.replyAll).to.have.been.calledWith($scope.email);
      });

      it('should expose a "forward" function', function() {
        inboxEmailService.forward = sinon.spy();

        controller.forward();

        expect(inboxEmailService.forward).to.have.been.calledWith($scope.email);
      });
    });

  });

  describe('The inboxEmailer directive', function() {

    it('should resolve the emailer', function() {
      $scope.emailer = {
        resolve: sinon.spy()
      };

      compileDirective('<inbox-emailer emailer="emailer"/>');

      expect($scope.emailer.resolve).to.have.been.calledWith();
    });

    it('should resolve the emailer when it becomes available', function() {
      compileDirective('<inbox-emailer emailer="emailer"/>');

      $scope.emailer = {
        resolve: sinon.spy()
      };
      $scope.$digest();

      expect($scope.emailer.resolve).to.have.been.calledWith();
    });

  });

  describe('The inboxEmailerAvatar directive', function() {

    it('should resolve the emailer', function() {
      $scope.emailer = {
        resolve: sinon.spy()
      };

      compileDirective('<inbox-emailer-avatar emailer="emailer"/>');

      expect($scope.emailer.resolve).to.have.been.calledWith();
    });

    it('should resolve the emailer when it becomes available', function() {
      compileDirective('<inbox-emailer-avatar emailer="emailer"/>');

      $scope.emailer = {
        resolve: sinon.spy()
      };
      $scope.$digest();

      expect($scope.emailer.resolve).to.have.been.calledWith();
    });

  });

  describe('The inboxVacationIndicator directive', function() {
    beforeEach(function() {
      notificationFactory.weakSuccess = sinon.spy();
      notificationFactory.weakError = sinon.spy();
      notificationFactory.strongInfo = sinon.spy();
    });

    it('should display the message when vacation is enabled', function() {
      jmapClient.getVacationResponse = function() {
        return $q.when({ isEnabled: true });
      };

      compileDirective('<inbox-vacation-indicator />');

      expect(element.find('.inbox-vacation-indicator')).to.have.length(1);
    });

    it('should not display the message when vacation is disabled', function() {
      jmapClient.getVacationResponse = function() {
        return $q.when({ isEnabled: false });
      };

      compileDirective('<inbox-vacation-indicator />');

      expect(element.find('.inbox-vacation-indicator')).to.have.length(0);
    });

    it('should not display the message when we cannot fetch the vacation status', function() {
      jmapClient.getVacationResponse = function() {
        return $q.reject();
      };

      compileDirective('<inbox-vacation-indicator />');

      expect(element.find('.inbox-vacation-indicator')).to.have.length(0);
    });

    it('should provide a button that removes the message and disables the vacation when clicked', function() {
      var isEnabled = true;

      jmapClient.getVacationResponse = function() {
        return $q.when({ isEnabled: isEnabled });
      };
      jmapClient.setVacationResponse = sinon.spy(function(vacation) {
        expect(vacation).to.shallowDeepEqual({
          isEnabled: false
        });
        isEnabled = false;

        return $q.when();
      });

      compileDirective('<inbox-vacation-indicator />').find('.inbox-disable-vacation').click();

      expect(jmapClient.setVacationResponse).to.have.been.calledWith();
      expect(element.find('.inbox-vacation-indicator')).to.have.length(0);
      expect(notificationFactory.strongInfo).to.have.been.calledWith('', 'Modification of vacation settings in progress...');
      expect(notificationFactory.weakSuccess).to.have.been.calledWith('', 'Modification of vacation settings succeeded');
    });

    it('should broadcast vacationEnabled when vacation is set successfully', function(done) {
      jmapClient.getVacationResponse = function() {
        return $q.when({ isEnabled: true });
      };
      jmapClient.setVacationResponse = sinon.spy(function() {
        return $q.when();
      });

      compileDirective('<inbox-vacation-indicator />');

      element.isolateScope().$on(INBOX_EVENTS.VACATION_STATUS, done.bind(this, null));

      element.find('.inbox-disable-vacation').click();
    });

    it('should listen on VACATION_STATUS to update vacationEnabled correspondingly', function() {
      var isEnabled = true;

      jmapClient.getVacationResponse = sinon.spy(function() {
        return $q.when({ isEnabled: isEnabled });
      });

      element = compileDirective('<inbox-vacation-indicator />');

      expect(jmapClient.getVacationResponse).to.have.been.calledOnce;
      $scope.$broadcast(INBOX_EVENTS.VACATION_STATUS);

      expect(jmapClient.getVacationResponse).to.have.been.calledTwice;
      expect(element.isolateScope().vacationEnabled).to.equal(isEnabled);
    });

    it('should show the message if vacation cannot be disabled', function() {
      jmapClient.getVacationResponse = function() {
        return $q.when({ isEnabled: true });
      };
      jmapClient.setVacationResponse = function() {
        return $q.reject();
      };

      compileDirective('<inbox-vacation-indicator />').find('.inbox-disable-vacation').click();

      expect(element.find('.inbox-vacation-indicator')).to.have.length(1);
      expect(notificationFactory.strongInfo).to.have.been.calledWith('', 'Modification of vacation settings in progress...');
      expect(notificationFactory.weakError).to.have.been.calledWith('Error', 'Modification of vacation settings failed');
    });

  });

  describe('The inboxClearFiltersButton directive', function() {

    var filters;

    beforeEach(inject(function(inboxFilters) {
      filters = inboxFilters;
    }));

    it('should clear filters when clicked', function() {
      filters[0].checked = true;
      filters[1].checked = true;

      compileDirective('<inbox-clear-filters-button />').children().first().click();

      expect(_.filter(filters, { checked: true })).to.deep.equal([]);
    });

    it('should broadcast inbox.filterChanged when clicked', function(done) {
      $scope.$on(INBOX_EVENTS.FILTER_CHANGED, function() {
        done();
      });

      compileDirective('<inbox-clear-filters-button />').children().first().click();
    });

  });

  describe('The inboxEmptyContainerMessage directive', function() {

    var filters;

    beforeEach(inject(function(inboxFilters) {
      filters = inboxFilters;
    }));

    it('should expose a isFilteringActive function, returning true if at least one fiter is checked', function() {
      filters[0].checked = true;

      compileDirective('<inbox-empty-container-message />');

      expect(element.isolateScope().isFilteringActive()).to.equal(true);
    });

    it('should expose a isFilteringActive function, returning false if no fiter is checked', function() {
      compileDirective('<inbox-empty-container-message />');

      expect(element.isolateScope().isFilteringActive()).to.equal(false);
    });

    it('should expose a isCustomMailbox attribute, true if the container is a custom mailbox', function() {
      $scope.mailbox = {
        role: jmap.MailboxRole.UNKNOWN
      };
      compileDirective('<inbox-empty-container-message mailbox="mailbox"/>');

      expect(!!element.isolateScope().isCustomMailbox).to.equal(true);
    });

    it('should expose a isCustomMailbox attribute, falsy if the container is not a custom mailbox', function() {
      $scope.mailbox = {
        role: jmap.MailboxRole.INBOX
      };
      compileDirective('<inbox-empty-container-message mailbox="mailbox"/>');

      expect(!!element.isolateScope().isCustomMailbox).to.equal(false);
    });

    it('should expose a isCustomMailbox attribute, falsy if the container is not a mailbox', function() {
      compileDirective('<inbox-empty-container-message />');

      expect(!!element.isolateScope().isCustomMailbox).to.equal(false);
    });

    it('should use role if defined', function() {
      compileDirective('<inbox-empty-container-message role="twitter"/>');

      expect(element.isolateScope().containerTemplateUrl).to.match(/twitter.html/);
    });

    it('should compute role if not defined, based on the mailbox role', function() {
      $scope.mailbox = {
        role: jmap.MailboxRole.INBOX
      };
      compileDirective('<inbox-empty-container-message mailbox="mailbox"/>');

      expect(element.isolateScope().containerTemplateUrl).to.match(/inbox.html/);
    });

    it('should use default role if mailbox is not a custom one', function() {
      $scope.mailbox = {
        role: jmap.MailboxRole.UNKNOWN
      };
      compileDirective('<inbox-empty-container-message mailbox="mailbox"/>');

      expect(element.isolateScope().containerTemplateUrl).to.match(/default.html/);
    });

  });

});
