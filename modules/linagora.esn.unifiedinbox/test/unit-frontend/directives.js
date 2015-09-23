'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The linagora.esn.unifiedinbox module directives', function() {

  var $compile, $rootScope, $scope, element, jmapClient;

  beforeEach(function() {
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
  }));

  beforeEach(inject(function(_$compile_, _$rootScope_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
  }));

  beforeEach(function() {
    $scope = $rootScope.$new();
  });

  function compileDirective(html) {
    element = angular.element(html);

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
      jmapClient.getMailboxes = function() { return $q.when([{ mailbox: '1' }]); };
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
      $scope.mailbox = {};
      compileDirective('<mailbox-display mailbox="mailbox" />');

      expect(element.isolateScope().mailboxIcons).to.equal('defaultclass');
    });

    it('should define $scope.mailboxIcons to the correct value when mailbox has a role', function() {
      $scope.mailbox = {
        role: 'testrole'
      };
      compileDirective('<mailbox-display mailbox="mailbox" />');

      expect(element.isolateScope().mailboxIcons).to.equal('testclass');
    });

  });

});
