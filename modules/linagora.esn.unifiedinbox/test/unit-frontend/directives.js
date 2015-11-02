'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The linagora.esn.unifiedinbox module directives', function() {
  var $compile, $rootScope, $scope, $q, $timeout, element, jmapClient, Offline = {}, notificationFactory, iFrameResize = function() {};
  var attendeeService;

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
        preferredEmail: 'user@open-paas.org'
      }
    });
    $provide.provider('iFrameResize', {
      $get: function() {
        return iFrameResize;
      }
    });
    $provide.value('notificationFactory', notificationFactory = {});
    $provide.value('attendeeService', attendeeService = {
      addProvider: function() {}
    });
    $provide.value('Offline', Offline);
  }));

  beforeEach(inject(function(_$compile_, _$rootScope_, _$q_, _$timeout_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $q = _$q_;
    $timeout = _$timeout_;
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
    var closeNotificationSpy = sinon.spy();
    var hideScopeSpy = sinon.spy();
    var notificationTitle = '', notificationText = '';
    beforeEach(function() {
      Offline.state = 'up';

      $scope.$hide = hideScopeSpy;

      notificationFactory.weakSuccess = function(callTitle, callText) {
        notificationTitle = callTitle;
        notificationText = callText;
      };

      notificationFactory.weakError = function(callTitle, callText) {
        notificationTitle = callTitle;
        notificationText = callText;
      };

      notificationFactory.notify = function() {
        notificationTitle = 'Info';
        notificationText = 'Sending';
        return {
          close: closeNotificationSpy
        };
      };
    });

    it('should not send an email with no recipient', function() {
      $scope.email = {
        rcpt: {
          to: [],
          cc: [],
          bcc: []
        }
      };

      var element = compileDirective('<composer/>');
      $scope.send();
      $scope.$digest();
      expect(notificationTitle).to.equal('Note');
      expect(notificationText).to.equal('Your email should have at least one recipient');
      expect(hideScopeSpy).to.not.be.called;
      expect(element.find('.btn-primary').attr('disabled')).to.be.undefined;
    });

    it('should not send if an invalid email is used as a recipient', function() {
      $scope.email = {
        rcpt: {
          to: [{displayName: '1', email: '1@linagora.com'}],
          cc: [{displayName: 'me', email: 'myemailATlinagoraPOINTcom'}],
          bcc: []
        }
      };

      var element = compileDirective('<composer/>');
      $scope.send();
      $scope.$digest();
      expect(notificationTitle).to.equal('Note');
      expect(notificationText).to.equal('Some recipient emails are not valid');
      expect(hideScopeSpy).to.not.be.called;
      expect(element.find('.btn-primary').attr('disabled')).to.be.undefined;
    });

    it('should not send an email during offline state', function() {
      Offline.state = 'down';

      $scope.email = {
        rcpt: {
          to: [{displayName: '1', email: '1@linagora.com'}],
          cc: [],
          bcc: []
        }
      };

      var element = compileDirective('<composer/>');
      $scope.send();
      $scope.$digest();
      expect(notificationTitle).to.equal('Note');
      expect(notificationText).to.equal('Your device loses its Internet connection. Try later!');
      expect(hideScopeSpy).to.not.be.called;
      expect(element.find('.btn-primary').attr('disabled')).to.be.undefined;
    });

    it('should successfully notify when a valid email is sent', function() {
      $scope.sendViaJMAP = function() {
        var defer = $q.defer();
        defer.resolve();
        return defer.promise;
      };

      $scope.email = {
        rcpt: {
          to: [{displayName: '1', email: '1@linagora.com'}, {displayName: '2', email: '2@linagora.com'}],
          cc: [{displayName: '1', email: '1@linagora.com'}, {displayName: '3', email: '3@linagora.com'}],
          bcc: [{displayName: '1', email: '1@linagora.com'}, {displayName: '2', email: '2@linagora.com'}, {displayName: '4', email: '4@linagora.com'}]
        }
      };

      var expectedRcpt = {
        to: [{displayName: '1', email: '1@linagora.com'}, {displayName: '2', email: '2@linagora.com'}],
        cc: [{displayName: '3', email: '3@linagora.com'}],
        bcc: [{displayName: '4', email: '4@linagora.com'}]
      };

      var element = compileDirective('<composer/>');
      $scope.send();
      $scope.$digest();
      expect(element.find('.btn-primary').attr('disabled')).to.be.defined;
      expect($scope.email.rcpt).to.shallowDeepEqual(expectedRcpt);
      expect(hideScopeSpy).to.be.called;
      expect(closeNotificationSpy).to.be.called;
      expect(notificationTitle).to.equal('Success');
      expect(notificationText).to.equal('Your email has been sent');
    });

    it('should successfully send an email even if only bcc is used', function() {
      $scope.sendViaJMAP = function() {
        var defer = $q.defer();
        defer.resolve();
        return defer.promise;
      };

      $scope.email = {
        rcpt: {
          to: [],
          cc: [],
          bcc: [{displayName: '1', email: '1@linagora.com'}]
        }
      };

      var element = compileDirective('<composer/>');
      $scope.send();
      $scope.$digest();
      expect(element.find('.btn-primary').attr('disabled')).to.be.defined;
      expect(hideScopeSpy).to.be.called;
      expect(closeNotificationSpy).to.be.called;
      expect(notificationTitle).to.equal('Success');
      expect(notificationText).to.equal('Your email has been sent');
    });

    it('should notify immediately about sending email for slow connection. The final notification is shown once the email is sent', function() {
      $scope.sendViaJMAP = function() {
        var defer = $q.defer();
        $timeout(function() {
          return defer.resolve();
        }, 200);
        return defer.promise;
      };

      $scope.email = {
        rcpt: {
          to: [{displayName: '1', email: '1@linagora.com'}]
        }
      };

      var element = compileDirective('<composer/>');
      $scope.send();
      $scope.$digest();
      expect(element.find('.btn-primary').attr('disabled')).to.be.defined;
      expect(notificationTitle).to.equal('Info');
      expect(notificationText).to.equal('Sending');
      $timeout.flush(201);
      expect(closeNotificationSpy).to.be.called;
      expect(notificationTitle).to.equal('Success');
      expect(notificationText).to.equal('Your email has been sent');
      expect(hideScopeSpy).to.be.called;
    });

    it('should notify immediately about sending email for slow connection. this notification is then replaced by an error one in the case of failure', function() {
      $scope.sendViaJMAP = function() {
        var defer = $q.defer();
        $timeout(function() {
          return defer.reject();
        }, 200);
        return defer.promise;
      };


      $scope.email = {
        rcpt: {
          to: [{displayName: '1', email: '1@linagora.com'}]
        }
      };

      var element = compileDirective('<composer/>');
      $scope.send();
      $scope.$digest();
      expect(element.find('.btn-primary').attr('disabled')).to.be.defined;
      expect(notificationTitle).to.equal('Info');
      expect(notificationText).to.equal('Sending');
      $timeout.flush(201);
      expect(closeNotificationSpy).to.be.called;
      expect(notificationTitle).to.equal('Error');
      expect(notificationText).to.equal('An error has occurred while sending email');
      expect(hideScopeSpy).to.be.called;
    });

    it('should notify and save draft when the composer is destroyed', function() {
      notificationFactory.weakInfo = function(callTitle, callText) {
        notificationTitle = callTitle;
        notificationText = callText;
      };
      compileDirective('<composer />');
      $scope.$emit('$destroy');
      expect(notificationTitle).to.equal('Note');
      expect(notificationText).to.equal('Your email has been saved as draft');
    });

    it('should expose a search function through its controller', function() {
      expect(compileDirective('<composer />').controller('composer').search).to.be.a('function');
    });

    it('should delegate searching to attendeeService', function(done) {
      attendeeService.getAttendeeCandidates = function(query, limit) {
        expect(query).to.equal('open-paas.org');

        done();
      };

      compileDirective('<composer />').controller('composer').search('open-paas.org');
    });

    it('should exclude search results with no email', function(done) {
      attendeeService.getAttendeeCandidates = function(query, limit) {
        expect(query).to.equal('open-paas.org');

        return $q.when([{
          displayName: 'user1',
          email: 'user1@open-paas.org'
        }, {
          displayName: 'user2'
        }]);
      };

      compileDirective('<composer />')
        .controller('composer')
        .search('open-paas.org')
        .then(function(results) {
          expect(results).to.deep.equal([{
            displayName: 'user1',
            email: 'user1@open-paas.org'
          }]);
        })
        .then(done, done);

      $rootScope.$digest();
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

  describe('The inboxFab directive', function() {

    var boxOverlayService;

    beforeEach(inject(function(_boxOverlayService_) {
      boxOverlayService = _boxOverlayService_;
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

  describe('The recipientsAutoComplete directive', function() {

    it('should define $scope.search from the composer directive controller', function(done) {
      compileDirective('<div><recipients-auto-complete ng-model="model"></recipients-auto-complete></div>', {
        $composerController: {
          search: done
        }
      });

      element.find('recipients-auto-complete').isolateScope().search();
    });

  });

  describe('The fullscreenRecipientsAutoComplete directive', function() {

    it('should define $scope.search from the composer directive controller', function(done) {
      compileDirective('<div fullscreen-edit-form-container><fullscreen-recipients-auto-complete ng-model="model"></fullscreen-recipients-auto-complete></div>', {
        $composerController: {
          search: done
        }
      });

      element.find('fullscreen-recipients-auto-complete').isolateScope().search();
    });

  });

});
