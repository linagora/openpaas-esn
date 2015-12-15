'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The linagora.esn.unifiedinbox module controllers', function() {

  var $stateParams, $rootScope, $location, scope, $controller, $timeout,
    jmapClient, jmap, notificationFactory, attendeeService, draftService, Offline = {},
    emailSendingService, Composition;

  beforeEach(function() {
    $stateParams = {
      mailbox: 'chosenMailbox',
      emailId: '4'
    };
    notificationFactory = {
      weakSuccess: function() {},
      weakError: function() {}
    };

    angular.mock.module('esn.core');
    angular.mock.module('esn.notification');

    module('linagora.esn.unifiedinbox', function($provide) {
      $provide.value('jmapClient', jmapClient = {});
      $provide.value('$stateParams', $stateParams);
      $provide.value('$location', $location = {});
      $provide.value('notificationFactory', notificationFactory);
      $provide.value('Offline', Offline);
      $provide.value('draftService', draftService = {});
      $provide.value('attendeeService', attendeeService = {
        addProvider: function() {}
      });
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
    return $controller(ctrl, {
      $scope: scope
    });
  }

  describe('The composerController', function() {

    beforeEach(inject(function() {
      draftService.startDraft = sinon.spy();

      scope.hide = sinon.spy();
      scope.disableSendButton = sinon.spy();
      scope.enableSendButton = sinon.spy();
      scope.email = {rcpt: []};
    }));

    it('should start the draft at init time', function() {
      scope.email = {obj: 'expected'};
      initController('composerController');
      expect(draftService.startDraft).to.have.been.calledWith({obj: 'expected'});
    });

    it('should save the draft when saveDraft is called', function() {
      Composition.prototype.saveDraft = sinon.spy();
      scope.email = {obj: 'expected'};

      initController('composerController').saveDraft();

      expect(Composition.prototype.saveDraft).to.have.been.calledOnce;
    });

    it('should not send an email when canBeSentOrNotify returns false', function() {
      Composition.prototype.canBeSentOrNotify = sinon.stub().returns(false);
      scope.email = {
        rcpt: {
          to: [],
          cc: [],
          bcc: []
        }
      };
      initController('composerController');

      scope.send();

      expect(scope.hide).to.have.not.been.called;
      expect(scope.disableSendButton).to.have.been.calledOnce;
      expect(scope.enableSendButton).to.have.been.calledOnce;
    });

    it('should send an email when canBeSentOrNotify returns true', function() {
      Composition.prototype.canBeSentOrNotify = sinon.stub().returns(true);
      Composition.prototype.send = sinon.spy();
      scope.email = {
        rcpt: {
          to: [{displayName: '1', email: '1@linagora.com'}],
          cc: [],
          bcc: []
        }
      };
      initController('composerController');

      scope.send();

      expect(scope.hide).to.have.been.calledOnce;
      expect(scope.disableSendButton).to.have.been.calledOnce;
      expect(Composition.prototype.send).to.have.been.calledOnce;
    });

    it('should delegate searching to attendeeService', function(done) {
      var ctrl = initController('composerController');
      attendeeService.getAttendeeCandidates = function(query, limit) {
        expect(query).to.equal('open-paas.org');

        done();
      };

      ctrl.search('open-paas.org');
    });

    it('should exclude search results with no email', function(done) {
      var ctrl = initController('composerController');
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

      $rootScope.$digest();
    });
  });

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
