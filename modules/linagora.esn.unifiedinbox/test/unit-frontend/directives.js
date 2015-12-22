'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The linagora.esn.unifiedinbox module directives', function() {

  var $compile, $rootScope, $scope, $q, $timeout, element, jmapClient,
    iFrameResize = angular.noop, elementScrollDownService, $stateParams;

  beforeEach(function() {
    angular.module('esn.iframe-resizer-wrapper', []);

    angular.mock.module('esn.ui');
    angular.mock.module('esn.core');
    angular.mock.module('esn.session');
    angular.mock.module('linagora.esn.unifiedinbox');
    module('jadeTemplates');
  });

  beforeEach(module(function($provide) {
    $provide.constant('MAILBOX_ROLE_ICONS_MAPPING', {
      testrole: 'testclass',
      default: 'defaultclass'
    });
    $provide.value('jmapClient', jmapClient = {});
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
    $provide.value('elementScrollDownService', elementScrollDownService = {});
    $provide.value('Fullscreen', {});
    $provide.value('ASTrackerController', {});
  }));

  beforeEach(inject(function(_$compile_, _$rootScope_, _$q_, _$timeout_, _$stateParams_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $q = _$q_;
    $timeout = _$timeout_;
    $stateParams = _$stateParams_;
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

  describe('The inboxMenu directive', function() {

    it('should set $scope.email to the logged-in user email', function() {
      compileDirective('<inbox-menu />');

      expect($scope.email).to.equal('user@open-paas.org');
    });

    it('should define $scope.toggleOpen as a function', function() {
      compileDirective('<inbox-menu />');

      expect($scope.toggleOpen).to.be.a('function');
    });

    it('should call jmapClient.getMailboxes() with no arguments when toggleOpen is called', function(done) {
      jmapClient.getMailboxes = done;
      compileDirective('<inbox-menu />');

      $scope.toggleOpen();
    });

    it('should set $scope.mailboxes to the returned mailboxes', function(done) {
      jmapClient.getMailboxes = function() { return $q.when([{ mailbox: '1', role: { value: null } }]); };
      compileDirective('<inbox-menu />');

      $scope.$watch('mailboxes', function(before, after) {
        expect(after).to.shallowDeepEqual([{ mailbox: '1' }]);

        done();
      });

      $scope.toggleOpen();
      $rootScope.$digest();
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

    var draftService, $location;

    beforeEach(inject(function(_$location_, _draftService_) {
      $location = _$location_;
      draftService = _draftService_;
    }));

    describe('its controller', function() {

      var directive, ctrl;

      beforeEach(function() {
        directive = compileDirective('<composer />');
        ctrl = directive.controller('composer');
        ctrl.saveDraft = sinon.spy();
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

      it('should change location when the composer is closed', function() {
        $location.path = sinon.spy();

        $scope.close();

        expect($location.path).to.have.been.calledWith('/unifiedinbox');
      });

      it('should not save a draft when the composer is hidden', function() {
        $scope.hide();
        $rootScope.$digest();

        expect(ctrl.saveDraft).to.have.not.been.called;
      });

      it('should change location when the composer is hidden', function() {
        $location.path = sinon.spy();

        $scope.hide();

        expect($location.path).to.have.been.calledWith('/unifiedinbox');
      });

      it('should expose a search function through its controller', function() {
        expect(ctrl.search).to.be.a('function');
      });

    });

    describe('The mobile header buttons', function() {

      var headerService, mainHeader, ctrl;

      beforeEach(inject(function(_headerService_) {
        headerService = _headerService_;

        mainHeader = compileDirective('<main-header/>');
        ctrl = compileDirective('<composer/>').controller('composer');
        ctrl.saveDraft = angular.noop;
      }));

      it('should bind the send button to the scope method', function() {
        $scope.send = sinon.spy();

        mainHeader.find('.composer-subheader .send-button').click();

        expect($scope.send).to.have.been.called;
      });

      it('should bind the close button to the scope method', function() {
        $scope.close = sinon.spy();

        mainHeader.find('.composer-subheader .close-button').click();

        expect($scope.close).to.have.been.called;
      });
    });

    describe('The mobile header display', function() {

      var headerService, ctrl;

      beforeEach(inject(function(_headerService_) {
        headerService = _headerService_;
        headerService.subHeader.addInjection = sinon.spy();
        headerService.subHeader.resetInjections = sinon.spy();

        ctrl = compileDirective('<composer/>').controller('composer');
        ctrl.saveDraft = angular.noop;
      }));

      it('should be shown when directive is linked', function() {
        expect(headerService.subHeader.addInjection).to.have.been.called;
      });

      it('should be shown when the fullscreen edit form is closed', function() {
        $rootScope.$broadcast('fullscreenEditForm:close');

        expect(headerService.subHeader.addInjection).to.have.been.calledTwice;
      });

      it('should be hidden when location has successfully changed', function() {
        $rootScope.$broadcast('$stateChangeSuccess');

        expect(headerService.subHeader.resetInjections).to.have.been.called;
      });

      it('should be hidden when the fullscreen edit form is shown', function() {
        $rootScope.$broadcast('fullscreenEditForm:show');

        expect(headerService.subHeader.resetInjections).to.have.been.called;
      });

      it('should be hidden when disableSendButton fn is called', function() {
        $scope.disableSendButton();

        expect(headerService.subHeader.resetInjections).to.have.been.called;
      });

      it('should be shown when enableSendButton fn is called', function() {
        $scope.enableSendButton();

        expect(headerService.subHeader.addInjection).to.have.been.calledTwice;
      });
    });

  });

  describe('The composer-desktop directive', function() {

    var draftService;

    beforeEach(inject(function(_draftService_) {
      draftService = _draftService_;
    }));

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

    it('should expose a search function through its controller', function() {
      expect(compileDirective('<composer-desktop />').controller('composerDesktop').search).to.be.a('function');
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

  });

  describe('The editorPlaceholder directive', function() {
    it('should add the value of the editorPlaceholder attribute to the contenteditable element', function() {
      var element = compileDirective('<div editor-placeholder="Write here"><div class="note-editable" contenteditable="true">Hello world!</div></div>');
      expect(element.find('.note-editable[contenteditable="true"]').attr('placeholder')).to.equal('Write here');
    });

    it('should do nothing when the editorPlaceholder attribute has no value', function() {
      var element = compileDirective('<div editor-placeholder><div class="note-editable" contenteditable="true">Hello world!</div></div>');
      expect(element.find('.note-editable[contenteditable="true"]').attr('placeholder')).to.be.undefined;
    });
  });

  /**
   * PhantomJS does not work fine with iFrame and 'load' events, thus the .skip()
   * Tests run under Chrome and Firefox, though...
   */
  describe.skip('The htmlEmailBody directive', function() {

    beforeEach(function() {
      $scope.email = {
        htmlBody: '<html><body><div>Hey, I am the email body !</div></body></html>'
      };
    });

    it('should contain an iframe element', function() {
      compileDirective('<html-email-body email="email" />');

      expect(element.find('iframe')).to.have.length(1);
    });

    it('should append a BASE tag to the iframe document\'s HEAD tag', function(done) {
      compileDirective('<html-email-body email="email" />');

      element.isolateScope().$on('iframe:loaded', function(event, iFrame) {
        expect(iFrame.contentDocument.head.children[0]).to.shallowDeepEqual({
          tagName: 'BASE',
          target: '_blank'
        });

        done();
      });
    });

    it('should append a SCRIPT tag to the iframe document\'s BODY tag', function(done) {
      compileDirective('<html-email-body email="email" />');

      element.isolateScope().$on('iframe:loaded', function(event, iFrame) {
        var script = iFrame.contentDocument.body.children[1];

        expect(script.tagName).to.equal('SCRIPT');
        expect(script.src).to.contain('/components/iframe-resizer/js/iframeResizer.contentWindow.js');

        done();
      });
    });

    it('should enable iFrame resizer on the iFrame', function(done) {
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

  });

  describe('The inboxFab directive', function() {

    var boxOverlayService, $location, newComposerService;

    beforeEach(inject(function(_boxOverlayService_, _$location_, _newComposerService_) {
      boxOverlayService = _boxOverlayService_;
      $location = _$location_;
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

  describe('The inboxMenu directive', function() {

    it('should set $scope.email to the logged-in user email', function() {
      compileDirective('<inbox-menu />');

      expect($scope.email).to.equal('user@open-paas.org');
    });

    it('should define $scope.toggleOpen as a function', function() {
      compileDirective('<inbox-menu />');

      expect($scope.toggleOpen).to.be.a('function');
    });

    it('should call jmapClient.getMailboxes() with no arguments when toggleOpen is called', function(done) {
      jmapClient.getMailboxes = done;
      compileDirective('<inbox-menu />');

      $scope.toggleOpen();
    });

    it('should set $scope.mailboxes to the returned mailboxes', function(done) {
      jmapClient.getMailboxes = function() { return $q.when([{ mailbox: '1', role: { value: null } }]); };
      compileDirective('<inbox-menu />');

      $scope.$watch('mailboxes', function(before, after) {
        expect(after).to.shallowDeepEqual([{ mailbox: '1' }]);

        done();
      });

      $scope.toggleOpen();
      $rootScope.$digest();
    });
  });

  describe('The sidebarMailboxesLoader directive', function() {

    it('should call jmapClient.getMailboxes()', function(done) {
      jmapClient.getMailboxes = done;
      compileDirective('<div sidebar-mailboxes-loader />');
    });

    it('should set $scope.mailboxes to the returned mailboxes', function() {
      jmapClient.getMailboxes = function() {return $q.when([{ mailbox: '1', role: { value: null } }]); };
      compileDirective('<div sidebar-mailboxes-loader />');
      expect($scope.mailboxes).to.shallowDeepEqual([{ mailbox: '1' }]);
    });
  });

  describe('The recipientsAutoComplete directive', function() {
    var autoScrollDownSpy, unifiedinboxTagsAddedSpy;

    beforeEach(function() {
      autoScrollDownSpy = sinon.spy();
      unifiedinboxTagsAddedSpy = sinon.spy();
      elementScrollDownService.autoScrollDown = autoScrollDownSpy;
    });

    it('should trigger an error if no template is given', function() {
      expect(function() {
        compileDirective('<div><recipients-auto-complete ng-model="model"></recipients-auto-complete></div>');
      }).to.throw(Error, 'This directive requires a template attribute');
    });

    it('should define $scope.search from the composer directive controller', function(done) {
      compileDirective('<div><recipients-auto-complete ng-model="model" template="recipients-auto-complete"></recipients-auto-complete></div>', {
        $composerController: {
          search: done
        }
      });

      element.find('recipients-auto-complete').isolateScope().search();
    });

    it('should define $scope.search from the composerDesktop directive controller', function(done) {
      compileDirective('<div><recipients-auto-complete ng-model="model" template="recipients-auto-complete"></recipients-auto-complete></div>', {
        $composerDesktopController: {
          search: done
        }
      });

      element.find('recipients-auto-complete').isolateScope().search();
    });

    it('should trigger an error if no controller have the search fn', function() {
      expect(function() {
        compileDirective('<div><recipients-auto-complete ng-model="model" template="recipients-auto-complete"></recipients-auto-complete></div>', {
          $composerController: {},
          $composerDesktopController: {}
        });
      }).to.throw(Error, 'Search function not found');
    });

    it('should scrolldown element when a tag is added and broadcast an event to inform the fullscreen-edit-form to scrolldown', function() {
      compileDirective('<div><recipients-auto-complete ng-model="model" template="recipients-auto-complete"></recipients-auto-complete></div>', {
        $composerController: {
          search: {}
        }
      });

      var scope = element.find('recipients-auto-complete').isolateScope();
      var recipient = {displayName: 'user@domain'};
      $scope.$on('unifiedinbox:tags_added', unifiedinboxTagsAddedSpy);
      scope.onTagAdded(recipient);
      expect(autoScrollDownSpy).to.be.called;
      expect(unifiedinboxTagsAddedSpy).to.be.called;
    });

    it('should leverage the recipient object to create a corresponding jmap json object', function() {
      compileDirective('<div><recipients-auto-complete ng-model="model" template="recipients-auto-complete"></recipients-auto-complete></div>', {
        $composerController: {
          search: {}
        }
      });

      var scope = element.find('recipients-auto-complete').isolateScope();
      var recipient = {displayName: 'user@domain'};
      scope.onTagAdded(recipient);
      expect(recipient).to.deep.equal({name: 'user@domain', email: 'user@domain', displayName: 'user@domain'});
    });
  });

});
