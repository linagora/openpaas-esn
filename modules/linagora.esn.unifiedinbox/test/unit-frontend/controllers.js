'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The linagora.esn.unifiedinbox module controllers', function() {

  var $stateParams, $rootScope, $location, scope, $controller, $timeout,
    jmapClient, jmap, notificationFactory, attendeeService, draftService, Offline = {},
    emailSendingService;

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

  beforeEach(angular.mock.inject(function(_$rootScope_, _$controller_, _jmap_, _$timeout_, _emailSendingService_) {
    $rootScope = _$rootScope_;
    $controller = _$controller_;
    jmap = _jmap_;
    $timeout = _$timeout_;
    emailSendingService = _emailSendingService_;

    scope = $rootScope.$new();
  }));

  function initController(ctrl) {
    return $controller(ctrl, {
      $scope: scope
    });
  }

  describe('The composerController', function() {

    var closeNotificationSpy, hideScopeSpy;
    var notificationTitle, notificationText;

    beforeEach(inject(function() {
      Offline.state = 'up';
      notificationTitle = '';
      notificationText = '';

      closeNotificationSpy = sinon.spy();
      draftService.startDraft = sinon.spy();
      scope.hide = hideScopeSpy = sinon.spy();
      scope.disableSendButton = sinon.spy();
      scope.enableSendButton = sinon.spy();
      scope.email = {rcpt: []};

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
    }));

    it('should start the draft at init time', function() {
      initController('composerController');
      expect(draftService.startDraft).to.be.calledWith({rcpt: []});
    });

    it('should save the draft when saveDraft is called', function() {
      var saveSpy = sinon.spy();
      draftService.startDraft = function() {
        return {
          save: saveSpy
        };
      };
      initController('composerController');

      scope.email = {obj: 'expected'};
      scope.saveDraft();

      expect(saveSpy).to.be.calledWith({obj: 'expected'});
    });

    it('should not send an email with no recipient', function() {
      initController('composerController');
      scope.email = {
        rcpt: {
          to: [],
          cc: [],
          bcc: []
        }
      };

      scope.send();
      expect(notificationTitle).to.equal('Note');
      expect(notificationText).to.equal('Your email should have at least one recipient');
      expect(hideScopeSpy).to.not.be.called;
      expect(scope.disableSendButton).to.be.called;
      expect(scope.enableSendButton).to.be.called;
    });

    it('should not send an email during offline state', function() {
      initController('composerController');
      Offline.state = 'down';

      scope.email = {
        rcpt: {
          to: [{displayName: '1', email: '1@linagora.com'}],
          cc: [],
          bcc: []
        }
      };

      scope.send();
      expect(notificationTitle).to.equal('Note');
      expect(notificationText).to.equal('Your device loses its Internet connection. Try later!');
      expect(hideScopeSpy).to.not.be.called;
      expect(scope.disableSendButton).to.be.called;
      expect(scope.enableSendButton).to.be.called;
    });

    it('should successfully notify when a valid email is sent', function() {
      initController('composerController');
      emailSendingService.sendEmail = sinon.stub().returns($q.when());

      scope.email = {
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

      scope.send();
      scope.$digest();
      expect(scope.email.rcpt).to.shallowDeepEqual(expectedRcpt);
      expect(hideScopeSpy).to.be.called;
      expect(closeNotificationSpy).to.be.called;
      expect(emailSendingService.sendEmail).to.be.called;
      expect(notificationTitle).to.equal('Success');
      expect(notificationText).to.equal('Your email has been sent');
      expect(scope.disableSendButton).to.be.called;
      expect(scope.enableSendButton).to.not.be.called;
    });

    it('should successfully send an email even if only bcc is used', function() {
      initController('composerController');
      emailSendingService.sendEmail = sinon.stub().returns($q.when());

      scope.email = {
        rcpt: {
          to: [],
          cc: [],
          bcc: [{displayName: '1', email: '1@linagora.com'}]
        }
      };

      scope.send();
      scope.$digest();
      expect(hideScopeSpy).to.be.called;
      expect(closeNotificationSpy).to.be.called;
      expect(emailSendingService.sendEmail).to.be.called;
      expect(notificationTitle).to.equal('Success');
      expect(notificationText).to.equal('Your email has been sent');
      expect(scope.disableSendButton).to.be.called;
      expect(scope.enableSendButton).to.not.be.called;
    });

    it('should notify immediately about sending email for slow connection. The final notification is shown once the email is sent', function() {
      initController('composerController');
      emailSendingService.sendEmail = sinon.stub().returns($timeout(function() {
        return $q.when();
      }, 200));

      scope.email = {
        rcpt: {
          to: [{displayName: '1', email: '1@linagora.com'}]
        }
      };

      scope.send();
      expect(notificationTitle).to.equal('Info');
      expect(notificationText).to.equal('Sending');
      $timeout.flush(201);
      expect(closeNotificationSpy).to.be.called;
      expect(emailSendingService.sendEmail).to.be.called;
      expect(notificationTitle).to.equal('Success');
      expect(notificationText).to.equal('Your email has been sent');
      expect(hideScopeSpy).to.be.called;
    });

    it('should notify immediately about sending email for slow connection. this notification is then replaced by an error one in the case of failure', function() {
      initController('composerController');
      emailSendingService.sendEmail = sinon.stub().returns($timeout(function() {
        return $q.reject();
      }, 200));

      scope.email = {
        rcpt: {
          to: [{displayName: '1', email: '1@linagora.com'}]
        }
      };

      scope.send();
      expect(notificationTitle).to.equal('Info');
      expect(notificationText).to.equal('Sending');
      $timeout.flush(201);
      expect(closeNotificationSpy).to.be.called;
      expect(emailSendingService.sendEmail).to.be.called;
      expect(notificationTitle).to.equal('Error');
      expect(notificationText).to.equal('An error has occurred while sending email');
      expect(hideScopeSpy).to.be.called;
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
