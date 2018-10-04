'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The esn.async-action Angular module', function() {

  beforeEach(function() {
    angular.mock.module('esn.async-action');
  });

  describe('The asyncAction factory', function() {

    var notificationFactory, notification, mockedFailureHandler, mockedSuccessHandler, EsnI18nString;
    var $rootScope, $timeout, asyncAction;
    var ASYNC_ACTION_LONG_TASK_DURATION;

    function qNoop() {
      return $q.when();
    }

    function qReject() {
      return $q.reject();
    }

    beforeEach(module(function($provide) {
      notification = {
        close: sinon.spy()
      };
      mockedFailureHandler = sinon.spy();
      mockedSuccessHandler = sinon.spy();
      notificationFactory = {
        strongInfo: sinon.spy(function() {
          return notification;
        }),
        weakSuccess: sinon.stub().returns({
          setCancelAction: mockedSuccessHandler
        }),
        weakError: sinon.stub().returns({
          setCancelAction: mockedFailureHandler
        })
      };

      $provide.value('notificationFactory', notificationFactory);
    }));

    beforeEach(inject(function(_asyncAction_, _$rootScope_, _$timeout_, _EsnI18nString_, _ASYNC_ACTION_LONG_TASK_DURATION_) {
      asyncAction = _asyncAction_;
      $rootScope = _$rootScope_;
      $timeout = _$timeout_;
      EsnI18nString = _EsnI18nString_;
      ASYNC_ACTION_LONG_TASK_DURATION = _ASYNC_ACTION_LONG_TASK_DURATION_;
    }));

    it('should start the action', function() {
      var action = sinon.spy(qNoop);

      asyncAction('Test', action);
      $rootScope.$digest();

      expect(action).to.have.been.calledWith();
    });

    it('should notify strongInfo when the action takes greater than ASYNC_ACTION_LONG_TASK_DURATION to finish', function() {
      asyncAction('Test', function() {
        return $timeout(angular.noop, ASYNC_ACTION_LONG_TASK_DURATION + 1);
      });

      $rootScope.$digest();
      $timeout.flush();

      expect(notificationFactory.strongInfo).to.have.been.calledWith('', 'Test in progress...');
    });

    it('should not notify strongInfo when the action takes less than ASYNC_ACTION_LONG_TASK_DURATION to finish', function() {
      asyncAction('Test', function() {
        return $timeout(angular.noop, ASYNC_ACTION_LONG_TASK_DURATION - 1);
      });

      $rootScope.$digest();
      $timeout.flush();

      expect(notificationFactory.strongInfo).to.not.have.been.called;
    });

    it('should close the strongInfo notification when action resolves', function() {
      asyncAction('Test', function() {
        return $timeout(angular.noop, ASYNC_ACTION_LONG_TASK_DURATION + 1);
      });

      $rootScope.$digest();
      $timeout.flush();

      expect(notification.close).to.have.been.calledWith();
    });

    it('should close the strongInfo notification when action rejects', function() {
      asyncAction('Test', function() {
        return $timeout(angular.noop, ASYNC_ACTION_LONG_TASK_DURATION + 1).then($q.reject);
      });

      $rootScope.$digest();
      $timeout.flush();

      expect(notification.close).to.have.been.calledWith();
    });

    it('should notify weakSuccess when action resolves', function() {
      asyncAction('Test', qNoop);
      $rootScope.$digest();

      expect(notificationFactory.weakSuccess).to.have.been.calledWith('Success', 'Test succeeded');
    });

    it('should notify weakError when action rejects', function() {
      asyncAction('Test', qReject);
      $rootScope.$digest();

      expect(notificationFactory.weakError).to.have.been.calledWith('Error', 'Test failed');
    });

    it('should provide a link when failure options is provided', function() {
      var failureConfig = {
        linkText: 'Test',
        action: function() {}
      };

      asyncAction('Test', qReject, {
        onFailure: failureConfig
      });
      $rootScope.$digest();

      expect(notificationFactory.weakError).to.have.been.calledWith('Error', 'Test failed');
      expect(mockedFailureHandler).to.have.been.calledWith(failureConfig);
    });

    it('should NOT provide any link when no failure option is provided', function() {
      asyncAction('Test', qReject);
      $rootScope.$digest();

      expect(notificationFactory.weakError).to.have.been.calledWith('Error', 'Test failed');
      expect(mockedFailureHandler).to.have.not.been.called;
    });

    it('should return a promise resolving to the resolved value of the action', function(done) {
      asyncAction('Test', function() {
          return $q.when(1);
        })
        .then(function(result) {
          expect(result).to.equal(1);

          done();
        });

      $rootScope.$digest();
    });

    it('should return a promise rejecting with the rejection value of the action', function(done) {
      asyncAction('Test', function() {
          return $q.reject('Bouh !');
        })
        .then(function() {
          done('The promise should not be resolved !');
        }, function(result) {
          expect(result).to.equal('Bouh !');

          done();
        });

      $rootScope.$digest();
    });

    it('should not notify when options has silent', function() {
      asyncAction('Test', qNoop, {
        silent: true
      });
      $rootScope.$digest();

      expect(notificationFactory.strongInfo).to.not.have.been.called;
      expect(notificationFactory.weakSuccess).to.not.have.been.called;
    });

    it('should notify error even when options has silent', function(done) {
      asyncAction('Test', qReject, {
          silent: true
        })
        .then(function() {
          done('The promise should not be resolved !');
        }, function() {
          expect(notificationFactory.weakError).to.have.been.calledWith('Error', 'Test failed');
          done();
        });

      $rootScope.$digest();
    });

    it('should support custom messages as an object for the first parameter', function(done) {
      var messages = {
        progressing: 'Hey there, I am a custom progressing message !',
        success: 'Yeepee'
      };

      asyncAction(messages, function() {
          return $timeout(angular.noop, ASYNC_ACTION_LONG_TASK_DURATION + 1);
        })
        .then(function() {
          expect(notificationFactory.strongInfo).to.have.been.calledWith('', 'Hey there, I am a custom progressing message !');
          expect(notificationFactory.weakSuccess).to.have.been.calledWith('Success', 'Yeepee');

          done();
        });
      $timeout.flush();
    });

    it('should support custom error messages as an object for the first parameter', function(done) {
      var messages = {
        progressing: 'Hey there, I am a custom progressing message !',
        failure: 'Booooh, I failed'
      };

      asyncAction(messages, function() {
          return $timeout(angular.noop, ASYNC_ACTION_LONG_TASK_DURATION + 1).then(qReject);
        })
        .then(null, function() {
          expect(notificationFactory.strongInfo).to.have.been.calledWith('', 'Hey there, I am a custom progressing message !');
          expect(notificationFactory.weakError).to.have.been.calledWith('Error', 'Booooh, I failed');

          done();
        });
      $timeout.flush();
    });

    it('should support a function as the success message, to dynamically compute the message', function() {
      asyncAction({
        success: function() {
          return 'From a function !';
        }
      }, qNoop);
      $rootScope.$digest();

      expect(notificationFactory.weakSuccess).to.have.been.calledWith('Success', 'From a function !');
    });

    it('should support a function as the progressing message, to dynamically compute the message', function(done) {
      asyncAction({
        progressing: function() {
          return 'Hey there, I am a custom progressing message !';
        },
        failure: 'Error'
      }, function() {
        return $timeout(angular.noop, ASYNC_ACTION_LONG_TASK_DURATION + 1).then(qReject);
      })
        .then(null, function() {
          expect(notificationFactory.strongInfo).to.have.been.calledWith('', 'Hey there, I am a custom progressing message !');

          done();
        });
      $timeout.flush();
    });

    it('should support a function as the failure message, to dynamically compute the message', function() {
      asyncAction({
        failure: function() {
          return 'From a function !';
        }
      }, qReject);
      $rootScope.$digest();

      expect(notificationFactory.weakError).to.have.been.calledWith('Error', 'From a function !');
    });

    it('should pass the error to the function as the failure message', function() {
      asyncAction({
        failure: function(err) {
          return err.myCustomErrorMessage;
        }
      }, function() {
        return $q.reject({
          myCustomErrorMessage: 'From a function !'
        });
      });
      $rootScope.$digest();

      expect(notificationFactory.weakError).to.have.been.calledWith('Error', 'From a function !');
    });

    it('should pass the resolved value to the function as the success message', function() {
      asyncAction({
        success: function(value) {
          return 'Success ' + value;
        }
      }, function() {
        return $q.when(10);
      });
      $rootScope.$digest();

      expect(notificationFactory.weakSuccess).to.have.been.calledWith('Success', 'Success 10');
    });

    it('should support EsnI18nString as a success message', function() {
      var i18nMessage = new EsnI18nString('i18n success message');

      asyncAction({
        success: i18nMessage
      }, function() {
        return $q.when();
      });
      $rootScope.$digest();

      expect(notificationFactory.weakSuccess).to.have.been.calledWith('Success', i18nMessage);
    });

    it('should support EsnI18nString as Error messages', function() {
      var messages = {
        progressing: new EsnI18nString('a I18n progressing message !'),
        failure: new EsnI18nString('a I18n failure message !')
      };

      asyncAction(messages, function() {
          return $timeout(angular.noop, ASYNC_ACTION_LONG_TASK_DURATION + 1).then(qReject);
        });
      $rootScope.$digest();
      $timeout.flush();

      expect(notificationFactory.strongInfo).to.have.been.calledWith('', messages.progressing);
      expect(notificationFactory.weakError).to.have.been.calledWith('Error', messages.failure);
    });

    it('should provide a link when success options is provided', function() {
      var successConfig = {
        linkText: 'Test',
        action: function() {}
      };

      asyncAction('Test', qNoop, {
        onSuccess: successConfig
      });
      $rootScope.$digest();

      expect(notificationFactory.weakSuccess).to.have.been.calledWith('Success', 'Test succeeded');
      expect(mockedSuccessHandler).to.have.been.calledWith(successConfig);
    });

    it('should NOT provide any link when no success option is provided', function() {
      asyncAction('Test', qNoop);
      $rootScope.$digest();

      expect(notificationFactory.weakSuccess).to.have.been.calledWith('Success', 'Test succeeded');
      expect(mockedSuccessHandler).to.have.not.been.called;
    });
  });

  describe('The rejectWithErrorNotification factory', function() {
    var $rootScope;
    var rejectWithErrorNotification;
    var notificationFactoryMock;

    beforeEach(function() {
      notificationFactoryMock = {
        weakError: angular.noop
      };

      module(function($provide) {
        $provide.value('notificationFactory', notificationFactoryMock);
      });

      inject(function(_$rootScope_, _rejectWithErrorNotification_) {
        $rootScope = _$rootScope_;
        rejectWithErrorNotification = _rejectWithErrorNotification_;
      });
    });

    it('should show notification with error message', function() {
      var msg = 'error message';

      notificationFactoryMock.weakError = sinon.spy();

      rejectWithErrorNotification(msg);

      expect(notificationFactoryMock.weakError).to.have.been.calledWithExactly('Error', msg);
    });

    it('should show notification until user intentionnaly closes', function() {
      var msg = 'error message';

      notificationFactoryMock.strongError = sinon.spy();

      rejectWithErrorNotification(msg, {persist: true});

      expect(notificationFactoryMock.strongError).to.have.been.calledWithExactly('Error', msg);
    });

    it('should define a cancelAction, if provided', function() {
      var notification = {
        setCancelAction: sinon.spy()
      };

      notificationFactoryMock.weakError = sinon.spy(function() {
        return notification;
      });

      rejectWithErrorNotification('error message', {onFailure: {a: 'b'}});

      expect(notification.setCancelAction).to.have.been.calledWith({
        a: 'b'
      });
    });

    it('should reject promise with error message', function(done) {
      var msg = 'error message';

      rejectWithErrorNotification(msg)
        .then(done.bind(null, 'should reject'), function(err) {
          expect(err.message).to.equal(msg);
          done();
        });

      $rootScope.$digest();
    });
  });

  describe('The notifySuccessWithFollowingAction factory', function() {
    var notifySuccessWithFollowingAction;
    var notificationFactoryMock;

    beforeEach(function() {
      notificationFactoryMock = {
        weakSuccess: angular.noop
      };

      module(function($provide) {
        $provide.value('notificationFactory', notificationFactoryMock);
      });

      inject(function(_notifySuccessWithFollowingAction_) {
        notifySuccessWithFollowingAction = _notifySuccessWithFollowingAction_;
      });
    });

    it('should show notification with success message', function() {
      var msg = 'success message';

      notificationFactoryMock.weakSuccess = sinon.spy();

      notifySuccessWithFollowingAction(msg);

      expect(notificationFactoryMock.weakSuccess).to.have.been.calledWithExactly('Success', msg);
    });

    it('should define a followingAction, if provided', function() {
      var notification = {
        setCancelAction: sinon.spy()
      };

      notificationFactoryMock.weakSuccess = sinon.spy(function() {
        return notification;
      });

      notifySuccessWithFollowingAction('success message', {
        a: 'b'
      });

      expect(notification.setCancelAction).to.have.been.calledWith({
        a: 'b'
      });
    });
  });
});
