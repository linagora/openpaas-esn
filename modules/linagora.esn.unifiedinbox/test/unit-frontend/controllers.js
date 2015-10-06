'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The linagora.esn.unifiedinbox module controllers', function() {

  var $route, $rootScope, $location, scope, $controller, jmapClient, jmap, notificationFactory;

  beforeEach(function() {
    $route = {
      current: {
        params: {
          mailbox: 'chosenMailbox',
          emailId: '4'
        }
      }
    };
    notificationFactory = {
      weakSuccess: function() {},
      weakError: function() {}
    };

    angular.mock.module('ngRoute');
    angular.mock.module('esn.core');
    angular.mock.module('esn.notification');

    module('linagora.esn.unifiedinbox', function($provide) {
      $provide.value('jmapClient', jmapClient = {});
      $provide.value('$route', $route);
      $provide.value('$location', $location = {});
      $provide.value('notificationFactory', notificationFactory);
    });
  });

  beforeEach(angular.mock.inject(function(_$rootScope_, _$controller_, _jmap_) {
    $rootScope = _$rootScope_;
    $controller = _$controller_;
    jmap = _jmap_;

    scope = $rootScope.$new();
  }));

  function initController(ctrl) {
    $controller(ctrl, {
      $scope: scope
    });
  }

  describe('The listEmailsController', function() {

    it('should set $scope.mailbox from the \'mailbox\' route parameter', function() {
      jmapClient.getMessageList = function() { return $q.when(); };

      initController('listEmailsController');

      expect(scope.mailbox).to.equal('chosenMailbox');
    });

    it('should call jmapClient.getMessageList with correct arguments', function(done) {
      jmapClient.getMessageList = function(options) {
        expect(options).to.deep.equal({
          filter: {
            inMailboxes: ['chosenMailbox']
          },
          collapseThreads: true,
          fetchMessages: true,
          position: 0,
          limit: 100
        });

        done();
      };

      initController('listEmailsController');
    });

    it('should build an EmailGroupingTool with the list of messages, and assign it to scope.groupedEmails', function(done) {
      jmapClient.getMessageList = function() {
        return $q.when([[], [{ email: 1 }]]);
      };

      initController('listEmailsController');

      scope.$watch('groupedEmails', function(before, after) {
        expect(after).to.be.a('Array');

        done();
      });
      $rootScope.$digest();
    });

  });

  describe('The viewEmailController', function() {

    it('should set $scope.mailbox and $scope.emailId from the route parameters', function() {
      jmapClient.getMessages = function() { return $q.when(); };

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
        return $q.when([{ email: 1 }]);
      };

      initController('viewEmailController');

      scope.$watch('email', function(before, after) {
        expect(after).to.deep.equal({ email: 1 });

        done();
      });
      $rootScope.$digest();
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
        $rootScope.$digest();

        scope.moveToTrash();
      });

      it('should update location to the parent mailbox when the message was successfully moved', function(done) {
        jmapClient.getMessages = function() {
          return $q.when([{
            moveToMailboxWithRole: function() {
              return $q.when();
            }
          }]);
        };
        $location.path = function(path) {
          expect(path).to.equal('/unifiedinbox/chosenMailbox');

          done();
        };

        initController('viewEmailController');
        $rootScope.$digest();

        scope.moveToTrash();
        $rootScope.$digest();
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
        $rootScope.$digest();

        scope.moveToTrash();
        $rootScope.$digest();
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
        $rootScope.$digest();

        scope.moveToTrash();
        $rootScope.$digest();
      });

    });

  });
});
