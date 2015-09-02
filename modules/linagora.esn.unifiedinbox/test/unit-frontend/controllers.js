'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Unified Inbox Angular module controllers', function() {

    var $route, $rootScope, $location, scope, $controller, JmapAPI;

    beforeEach(function() {
      JmapAPI = {};
      $route = {
        current: {
          params: {
            mailbox: 'chosenMailbox',
            emailId: '4'
          }
        }
      };
      $location = {};

      angular.mock.module('ngRoute');
      angular.mock.module('esn.core');

      module('linagora.esn.unifiedinbox', function($provide) {
        $provide.value('JmapAPI', JmapAPI);
        $provide.value('$route', $route);
        $provide.value('$location', $location);
      });
    });

    beforeEach(angular.mock.inject(function(_$rootScope_, _$controller_) {
      $rootScope = _$rootScope_;
      $controller = _$controller_;

      scope = $rootScope.$new();
    }));

    describe('listEmailsController', function() {

      it('should take the mailbox variable from the route params', function() {
        var calledWithMailbox;
        JmapAPI.getEmails = function(mailbox) {
          calledWithMailbox = mailbox;
          return $q.when();
        };

        $controller('listEmailsController', {
          $scope: scope
        });

        expect(calledWithMailbox).to.equal('chosenMailbox');
      });

      it('should assign the getEmails result to the scope', function() {
        JmapAPI.getEmails = function(mailbox) {
          return 'result';
        };

        $controller('listEmailsController', {
          $scope: scope
        });

        expect(scope.groupedEmails).to.equal('result');
      });

    });

    describe('viewEmailController', function() {

      it('should take the mailbox and emailId variables from the route params', function() {
        JmapAPI.getEmail = function() {};

        $controller('viewEmailController', {
          $scope: scope
        });

        expect(scope.mailbox).to.equal('chosenMailbox');
        expect(scope.emailId).to.equal('4');
      });

      it('should assign the getEmail result to the scope', function() {
        JmapAPI.getEmail = function(emailId) {
          return 'result';
        };

        $controller('viewEmailController', {
          $scope: scope
        });

        expect(scope.email).to.equal('result');
      });

      describe('the moveToTrash fn', function() {

        it('should delegate to JmapAPI with expected args', function(done) {
          JmapAPI.getEmail = function() {
            return 'result';
          };
          JmapAPI.moveToByRole = function(emailId, role) {
            expect(scope.emailId).to.equal('4');
            expect(role).to.equal('trash');
            done();
          };

          $controller('viewEmailController', {
            $scope: scope
          });

          scope.moveToTrash();
        });

        it('should update location to the parent mailbox', function(done) {
          JmapAPI.getEmail = function() {
            return 'result';
          };
          JmapAPI.moveToByRole = function() {};
          $location.path = function(path) {
            expect(path).to.equal('/unifiedinbox/chosenMailbox');
            done();
          };

          $controller('viewEmailController', {
            $scope: scope
          });

          scope.moveToTrash();
        });

      });

    });
});
