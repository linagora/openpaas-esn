'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The linagora.esn.unifiedinbox module directives', function() {

  var $compile, $rootScope, $scope, $q, $timeout, $window, element, jmapClient,
      iFrameResize = angular.noop, elementScrollService, $stateParams,
      isMobile, searchService, autosize, windowMock;

  beforeEach(function() {
    angular.module('esn.iframe-resizer-wrapper', []);

    angular.mock.module('esn.ui');
    angular.mock.module('esn.core');
    angular.mock.module('esn.session');
    angular.mock.module('linagora.esn.unifiedinbox');
    module('jadeTemplates');
  });

  beforeEach(module(function($provide) {
    isMobile = false;
    windowMock = {
      open: sinon.spy()
    };

    $provide.constant('MAILBOX_ROLE_ICONS_MAPPING', {
      testrole: 'testclass',
      default: 'defaultclass'
    });
    jmapClient = {};
    $provide.constant('withJmapClient', function(callback) {
      callback(jmapClient);
    });
    $provide.value('session', {
      user: {
        preferredEmail: 'user@open-paas.org',
        emails: ['user@open-paas.org']
      }
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
    $provide.decorator('$window', function($delegate) {
      return angular.extend($delegate, windowMock);
    });
    $provide.value('Fullscreen', {});
    $provide.value('ASTrackerController', {});
    $provide.value('deviceDetector', { isMobile: function() { return isMobile;} });
    $provide.value('searchService', searchService = { searchRecipients: angular.noop });
    $provide.value('autosize', autosize = sinon.spy());
  }));

  beforeEach(inject(function(_$compile_, _$rootScope_, _$q_, _$timeout_, _$stateParams_, _$window_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $q = _$q_;
    $timeout = _$timeout_;
    $stateParams = _$stateParams_;
    $window = _$window_;
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

    it('should call the openEmailCustomTitle fn when clicked on mailto link', function() {
      emailElement = compileDirective('<a ng-href="mailto:SOMEONE" op-inbox-compose op-inbox-compose-display-name="SOMETHING"/>');
      newComposerService.openEmailCustomTitle = sinon.spy();

      emailElement.click();
      expect(newComposerService.openEmailCustomTitle).to.have.been.calledWith(null,
        {
          to:[{
            email: 'SOMEONE',
            name: 'SOMETHING'
          }]
        }
      );
    });

    it('should call the openEmailCustomTitle fn when put email in opInboxCompose attribute', function() {
      emailElement = compileDirective('<a op-inbox-compose="SOMEONE" op-inbox-compose-display-name="SOMETHING"/>');
      newComposerService.openEmailCustomTitle = sinon.spy();

      emailElement.click();
      expect(newComposerService.openEmailCustomTitle).to.have.been.calledWith(null,
        {
          to:[{
            email: 'SOMEONE',
            name: 'SOMETHING'
          }]
        }
      );
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

    it('should not call the openEmailCustomTitle fn when the link does not contain mailto', function() {
      emailElement = compileDirective('<a ng-href="tel:SOMEONE"/>');
      newComposerService.openEmailCustomTitle = sinon.spy();

      emailElement.click();

      expect(newComposerService.openEmailCustomTitle).to.have.not.been.called;
    });

    it('should not call the openEmailCustomTitle fn when the link does not mailto and opInboxCompose attribute is undefined', function() {
      emailElement = compileDirective('<a op-inbox-compose />');
      newComposerService.openEmailCustomTitle = sinon.spy();

      emailElement.click();

      expect(newComposerService.openEmailCustomTitle).to.have.not.been.called;
    });

    it('should not call the openEmailCustomTitle fn when the link does not mailto and opInboxCompose attribute is default', function() {
      emailElement = compileDirective('<a op-inbox-compose="op-inbox-compose" />');
      newComposerService.openEmailCustomTitle = sinon.spy();

      emailElement.click();

      expect(newComposerService.openEmailCustomTitle).to.have.not.been.called;
    });

    it('should call the openEmailCustomTitle fn with correct email', function() {
      emailElement = compileDirective('<a ng-href="mailto:SOMEONE" op-inbox-compose="SOMEBODY" />');
      newComposerService.openEmailCustomTitle = sinon.spy();

      emailElement.click();

      expect(newComposerService.openEmailCustomTitle).to.have.been.calledWith(null,
        {
          to:[{
            email: 'SOMEONE',
            name: 'SOMEONE'
          }]
        }
      );
    });

    it('should it should use the email address as the display name if display name is not defined', function() {
      emailElement = compileDirective('<a op-inbox-compose ng-href="mailto:SOMEONE"/>');
      newComposerService.openEmailCustomTitle = sinon.spy();

      emailElement.click();

      expect(newComposerService.openEmailCustomTitle).to.have.been.calledWith(null,
        {
          to:[{
            email: 'SOMEONE',
            name: 'SOMEONE'
          }]
        }
      );
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

  });

  describe('The composer directive', function() {

    var draftService, $state, $stateParams, headerService;

    beforeEach(inject(function(_$state_, _draftService_, _$stateParams_, _headerService_) {
      $state = _$state_;
      draftService = _draftService_;
      $stateParams = _$stateParams_;
      headerService = _headerService_;
    }));

    it('should return false when isBoxed is called', function() {
      compileDirective('<composer />');

      expect($scope.isBoxed()).to.equal(false);
    });

    it('should call headerService.subHeader.setVisibleMD', function() {
      headerService.subHeader.setVisibleMD = sinon.spy();
      compileDirective('<composer />');
      expect(headerService.subHeader.setVisibleMD).to.have.been.called;
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

      it('should save draft when location has successfully changed', function() {
        $rootScope.$broadcast('$stateChangeSuccess');

        expect(ctrl.saveDraft).to.have.been.calledOnce;
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

    });

    describe('The mobile header buttons', function() {

      var headerService, mainHeader, ctrl;

      beforeEach(inject(function(_headerService_) {
        headerService = _headerService_;

        ctrl = compileDirective('<composer/>').controller('composer');
        ctrl.saveDraft = angular.noop;
        mainHeader = compileDirective('<main-header/>');
      }));

      it('should bind the send button to the scope method', function() {
        $scope.send = sinon.spy();

        mainHeader.find('.inbox-subheader.composer .send').click();

        expect($scope.send).to.have.been.called;
      });

      it('should bind the close button to the scope method', function() {
        $scope.close = sinon.spy();

        mainHeader.find('.inbox-subheader.composer .close.button').click();

        expect($scope.close).to.have.been.called;
      });
    });

    describe('The mobile header display', function() {

      var headerService, ctrl;

      beforeEach(inject(function(_headerService_) {
        headerService = _headerService_;
        headerService.subHeader.setInjection = sinon.spy();
        headerService.subHeader.resetInjections = sinon.spy();

        ctrl = compileDirective('<composer/>').controller('composer');
        ctrl.saveDraft = angular.noop;
      }));

      it('should be shown when directive is linked', function() {
        expect(headerService.subHeader.setInjection).to.have.been.called;
      });

      it('should be hidden when location has successfully changed', function() {
        $rootScope.$broadcast('$stateChangeSuccess');

        expect(headerService.subHeader.resetInjections).to.have.been.called;
      });

      it('should be hidden when disableSendButton fn is called', function() {
        $scope.disableSendButton();

        expect(headerService.subHeader.resetInjections).to.have.been.called;
      });

      it('should be shown when enableSendButton fn is called', function() {
        $scope.enableSendButton();

        expect(headerService.subHeader.setInjection).to.have.been.calledTwice;
      });
    });

    describe('The editQuotedMail function', function() {

      function expectFocusAt(position) {
        var textarea = element.find('.compose-body').get(0);

        expect(document.activeElement).to.equal(textarea);
        expect(textarea.selectionStart).to.equal(position);
        expect(textarea.selectionEnd).to.equal(position);
      }

      beforeEach(inject(function($templateCache) {
        isMobile = true;
        autosize.update = sinon.spy();

        $templateCache.put('/unifiedinbox/views/partials/quotes/default.txt', '{{ email.textBody }} Quote {{ email.quoted.textBody }}');
      }));

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

    it('should disable button when disableSendButton fn is called', function() {
      var element = compileDirective('<composer-desktop/>');

      $scope.disableSendButton();

      expect(element.find('.btn-primary').attr('disabled')).to.be.defined;
    });

    it('should enable button when enableSendButton fn is called', function() {
      var element = compileDirective('<composer-desktop/>');

      $scope.enableSendButton();

      expect(element.find('.btn-primary').attr('disabled')).to.be.undefined;
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

    it.skip('should append a BASE tag to the iframe document\'s HEAD tag', function(done) {
      compileDirective('<html-email-body email="email" />');

      element.isolateScope().$on('iframe:loaded', function(event, iFrame) {
        expect(iFrame.contentDocument.head.children[0]).to.shallowDeepEqual({
          tagName: 'BASE',
          target: '_blank'
        });

        done();
      });
    });

    it.skip('should append a SCRIPT tag to the iframe document\'s BODY tag', function(done) {
      compileDirective('<html-email-body email="email" />');

      element.isolateScope().$on('iframe:loaded', function(event, iFrame) {
        var script = iFrame.contentDocument.body.children[1];

        expect(script.tagName).to.equal('SCRIPT');
        expect(script.src).to.contain('/components/iframe-resizer/js/iframeResizer.contentWindow.js');

        done();
      });
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
        contentDocument: {
          body: {
            appendChild: angular.noop
          },
          head: {
            appendChild: angular.noop
          }
        }
      });
      $rootScope.$broadcast('email:collapse');
      $timeout.flush();
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
    var unifiedinboxTagsAddedSpy;

    beforeEach(function() {
      unifiedinboxTagsAddedSpy = sinon.spy();
    });

    it('should trigger an error if no template is given', function() {
      expect(function() {
        compileDirective('<div><recipients-auto-complete ng-model="model"></recipients-auto-complete></div>');
      }).to.throw(Error, 'This directive requires a template attribute');
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
      compileDirective('<div><recipients-auto-complete ng-model="model" template="recipients-auto-complete"></recipients-auto-complete></div>', {
        $composerController: {
          search: {}
        }
      });

      var scope = element.find('recipients-auto-complete').isolateScope();
      var recipient = {displayName: 'user@domain'};

      scope.onTagAdded(recipient);

      expect(elementScrollService.autoScrollDown).to.have.been.calledWith();
    });

    it('should leverage the recipient object to create a corresponding jmap json object', function() {
      compileDirective('<div><recipients-auto-complete ng-model="model" template="recipients-auto-complete"></recipients-auto-complete></div>', {
        $composerController: {
          search: {}
        }
      });

      var scope = element.find('recipients-auto-complete').isolateScope();
      var recipient = { displayName: 'user@domain' };

      expect(scope.onTagAdding(recipient)).to.equal(true);
      expect(recipient).to.deep.equal({name: 'user@domain', email: 'user@domain', displayName: 'user@domain'});
    });

    it('should refuse to add a new tag if displayName matches the email of an existing tag', function() {
      compileDirective('<div><recipients-auto-complete ng-model="model" template="recipients-auto-complete"></recipients-auto-complete></div>', {
        $composerController: {
          search: {}
        }
      });

      var scope = element.find('recipients-auto-complete').isolateScope();

      scope.tags.push({ email: 'user@domain' });
      scope.tags.push({ email: 'user2@domain' });
      scope.tags.push({ email: 'user3@domain' });

      expect(scope.onTagAdding({ displayName: 'user@domain' })).to.equal(false);
    });

    it('should refuse to add a new tag if email matches the email of an existing tag', function() {
      compileDirective('<div><recipients-auto-complete ng-model="model" template="recipients-auto-complete"></recipients-auto-complete></div>', {
        $composerController: {
          search: {}
        }
      });

      var scope = element.find('recipients-auto-complete').isolateScope();

      scope.tags.push({ email: 'user@domain' });
      scope.tags.push({ email: 'user2@domain' });
      scope.tags.push({ email: 'user3@domain' });

      expect(scope.onTagAdding({ email: 'user2@domain' })).to.equal(false);
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

    describe('the toggleIsCollapsed function', function() {

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

        scope.$on('email:collapse', function(event, data) {
          expect(data).to.equal(false);
          done();
        });

        element.controller('email').toggleIsCollapsed(email);
      });
    });

  });

  describe('The emailStar directive', function() {

    describe('The setIsFlagged function', function() {

      it('should call email.setIsFlagged, passing the flag', function(done) {
        $scope.email = {
          setIsFlagged: function(state) {
            expect(state).to.equal(true);

            done();
          }
        };

        compileDirective('<email-star email="email" />').controller('emailStar').setIsFlagged(true);
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

  describe('The emailBodyAttachments directive', function() {

    var elementScrollService;

    beforeEach(inject(function(_elementScrollService_) {
      elementScrollService = _elementScrollService_;

      elementScrollService.scrollDownToElement = sinon.spy();
    }));

    function emitAddEvent() {
      $scope.$broadcast('composer:attachment:add');
      $scope.$digest();
    }

    function expectScrollToAttachmentNamed(expectedName, callIndex) {
      var callIndexArgs = elementScrollService.scrollDownToElement.args[callIndex];
      expect(callIndexArgs[0].attr('name')).to.equal(expectedName);
    }

    it('should not try to scroll when there is no attachment', function() {
      $scope.attachments = [];
      compileDirective('<email-body-attachments />');

      emitAddEvent();

      expect(elementScrollService.scrollDownToElement).to.not.have.been.called;
    });

    it('should scroll to the only attachment when there is only one', function() {
      $scope.attachments = [{height:64, id:'2'}];
      compileDirective('<email-body-attachments />');

      emitAddEvent();

      expect(elementScrollService.scrollDownToElement).to.have.been.calledOnce;
      expectScrollToAttachmentNamed('attachment-0', 0);
    });

    it('should scroll to the last attachment when there are many', function() {
      $scope.attachments = [{height:64, id:'2'}, {height:65, id:'3'}, {height:66, id:'4'}];
      compileDirective('<email-body-attachments />');

      emitAddEvent();

      expect(elementScrollService.scrollDownToElement).to.have.been.calledOnce;
      expectScrollToAttachmentNamed('attachment-2', 0);
    });

    it('should scroll to the last attachment every time that there is a new one', function() {
      $scope.attachments = [{height:64, id:'2'}];
      compileDirective('<email-body-attachments />');

      emitAddEvent();

      $scope.attachments.push({height:65, id:'3'});
      $scope.$digest();
      emitAddEvent();

      $scope.attachments.push({height:66, id:'4'});
      $scope.attachments.push({height:67, id:'5'});
      $scope.$digest();
      emitAddEvent();

      expect(elementScrollService.scrollDownToElement).to.have.been.calledThrice;
      expectScrollToAttachmentNamed('attachment-0', 0);
      expectScrollToAttachmentNamed('attachment-1', 1);
      expectScrollToAttachmentNamed('attachment-3', 2);
    });

  });

});
