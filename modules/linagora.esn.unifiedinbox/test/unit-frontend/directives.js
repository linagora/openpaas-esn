'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The linagora.esn.unifiedinbox module directives', function() {

  var $compile, $rootScope, $scope, element, jmapClient, iFrameResize = function() {};

  beforeEach(function() {
    angular.module('esn.iframe-resizer-wrapper', []);

    angular.mock.module('esn.session');
    angular.mock.module('linagora.esn.unifiedinbox');
    module('jadeTemplates');
  });

  beforeEach(module(function($provide) {
    $provide.constant('MAILBOX_ROLE_ICONS_MAPPING', {
      'testrole': 'testclass',
      'default': 'defaultclass'
    });
    $provide.value('jmapClient', jmapClient = {});
    $provide.value('session', {
      user: {
        preferredEmail: 'user@open-paas.org'
      }
    });
    $provide.provider('iFrameResize', {
      $get: function() {
        return iFrameResize;
      }
    });
  }));

  beforeEach(inject(function(_$compile_, _$rootScope_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
  }));

  beforeEach(function() {
    $scope = $rootScope.$new();
  });

  afterEach(function() {
    if (element) {
      element.remove();
    }
  });

  function compileDirective(html) {
    element = angular.element(html);
    element.appendTo(document.body);

    $compile(element)($scope);
    $scope.$digest();
  }

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
        expect(options).to.deep.equal({
          checkOrigin: false,
          scrolling: true,
          inPageLinks: true
        });

        done();
      };

      compileDirective('<html-email-body email="email" />');
    });

  });

});
