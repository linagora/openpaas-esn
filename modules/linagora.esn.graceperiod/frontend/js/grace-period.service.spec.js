'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The gracePeriodService service', function() {

  var gracePeriodService, $httpBackend, $rootScope, gracePeriodLiveNotificationServiceMock,
      notifyServiceMock, taskDeferred, timeoutMock, GRACE_DELAY, HTTP_LAG_UPPER_BOUND,
      httpSpy, notificationMock, notificationCancelCallback,
      errorMessage, id;

  function initTimeout() {
    timeoutMock = sinon.spy(function(callback, delay) {
      if (delay === GRACE_DELAY - HTTP_LAG_UPPER_BOUND) {
        $httpBackend.whenDELETE('/graceperiod/api/tasks/' + id).respond(404, errorMessage);
        return $q.when(callback());
      }
    });
  }

  beforeEach(function() {
    module('esn.websocket');
    module('linagora.esn.graceperiod');

    timeoutMock = null;
    notificationMock = {
      setCancelAction: sinon.spy(function(options) {
        notificationCancelCallback = options.action;
      }),
      close: sinon.spy()
    };

    notifyServiceMock = sinon.stub().returns(notificationMock);

    errorMessage = 'errorMessage';
    id = 'id';

    module(function($provide) {

      $provide.factory('gracePeriodLiveNotificationService', function($q) {
        taskDeferred = $q.defer();
        gracePeriodLiveNotificationServiceMock = {
          registerListeners: sinon.stub().returns(taskDeferred.promise),
          start: sinon.spy()
        };

        return gracePeriodLiveNotificationServiceMock;
      });

      $provide.value('notifyService', notifyServiceMock);

      $provide.decorator('$timeout', function($delegate) {
        return function() {
          return (timeoutMock || $delegate).apply(this, arguments);
        };
      });

      $provide.decorator('$http', function($delegate) {
        httpSpy = sinon.spy(function() {
          return $delegate.apply(this, arguments);
        });

        return httpSpy;
      });
    });
  });

  beforeEach(angular.mock.inject(function(_gracePeriodService_, _$rootScope_, _$httpBackend_, _GRACE_DELAY_, _HTTP_LAG_UPPER_BOUND_) {
    $rootScope = _$rootScope_;
    gracePeriodService = _gracePeriodService_;
    $httpBackend = _$httpBackend_;
    GRACE_DELAY = _GRACE_DELAY_;
    HTTP_LAG_UPPER_BOUND = _HTTP_LAG_UPPER_BOUND_;
  }));

  describe('The flush fn', function() {

    it('should not call PUT and reject when id does exists', function(done) {
      gracePeriodService.flush(id).then(null, function() { done(); });
      $rootScope.$apply();
      $httpBackend.flush();
    });

    it('should call PUT when id exists', function(done) {
      gracePeriodService.grace({id: id});

      gracePeriodService.flush(id).then(function() {
        done();
      }, done);
      $httpBackend.expectPUT('/graceperiod/api/tasks/' + id).respond({});
      $rootScope.$apply();
      $httpBackend.flush();
    });
  });

  describe('The cancel fn', function() {

    it('should not call DELETE and reject when task does not exists', function() {
      var errorSpy = sinon.spy();

      gracePeriodService.cancel(id).catch(errorSpy);
      $rootScope.$apply();
      expect(errorSpy).to.have.been.calledOnce;
    });

    it('should call DELETE when task exists', function() {
      var spy = sinon.spy();

      gracePeriodService.grace({id: id});
      gracePeriodService.cancel(id).then(spy);

      $httpBackend.expectDELETE('/graceperiod/api/tasks/' + id).respond(200, {});
      $httpBackend.flush();
      $rootScope.$apply();
      expect(spy).to.have.been.calledOnce;
    });

    it('should try to DELETE a second time before the end of the graceperiod and success if it success on the second time', function(done) {
      var id = '123';
      var responseData = 'this is data';

      $httpBackend.expectDELETE('/graceperiod/api/tasks/' + id).respond(404, 'not found');

      timeoutMock = sinon.spy(function(callback, delay) {
        if (delay === GRACE_DELAY - HTTP_LAG_UPPER_BOUND) {
          $httpBackend.expectDELETE('/graceperiod/api/tasks/' + id).respond(200, responseData);
          return $q.when(callback());
        }
      });

      gracePeriodService.grace({id: id});

      gracePeriodService.cancel(id).then(function(response) {
        expect(response).to.shallowDeepEqual({
          status: 200,
          data: responseData
        });
        expect(timeoutMock).to.have.been.calledWith(sinon.match.any, GRACE_DELAY - HTTP_LAG_UPPER_BOUND);
        done();
      }, done.bind(null, 'This promise should have succeed'));

      $rootScope.$apply();
      $httpBackend.flush();
    });

    it('should try to DELETE a second time before the end of the graceperiod and fail if it fail on the second time', function(done) {
      var id = '123';
      var errorMessage = 'not found';
      timeoutMock = sinon.spy(function(callback, delay) {
        if (delay === GRACE_DELAY - HTTP_LAG_UPPER_BOUND) {
          $httpBackend.expectDELETE('/graceperiod/api/tasks/' + id).respond(404, errorMessage);
          return $q.when(callback());
        }
      });

      gracePeriodService.grace({id: id});

      gracePeriodService.cancel(id).then(done.bind(null, 'This promise should have fail'), function(error) {
        expect(error).to.shallowDeepEqual({
          status: 404,
          data: errorMessage
        });
        expect(timeoutMock).to.have.been.calledWith(sinon.match.any, GRACE_DELAY - HTTP_LAG_UPPER_BOUND);
        done();
      });

      $httpBackend.expectDELETE('/graceperiod/api/tasks/' + id).respond(404, 'not found');
      $rootScope.$apply();
      $httpBackend.flush();
    });

    it('should try to DELETE a second time with a timeout of HTTP_LAG_UPPER_BOUND if it fail the first time', function(done) {
      var id = '123';

      timeoutMock = sinon.spy(function(callback, delay) {
        if (delay === GRACE_DELAY - HTTP_LAG_UPPER_BOUND) {
          $httpBackend.expectDELETE('/graceperiod/api/tasks/' + id).respond(404, 'test');
          return $q.when(callback());
        }
      });

      gracePeriodService.grace({id: id});

      gracePeriodService.cancel(id).finally(function() {
        expect(httpSpy).to.have.been.calledWith(sinon.match.has('timeout', HTTP_LAG_UPPER_BOUND));
        done();
      });

      $httpBackend.expectDELETE('/graceperiod/api/tasks/' + id).respond(404, 'not found');
      $rootScope.$apply();
      $httpBackend.flush();
    });

    it('should try to DELETE the first time with a timeout promise that trigger HTTP_LAG_UPPER_BOUND before the end of the grace period', function(done) {
      var id = '123';

      var promiseBeforeEndOfGraceperiod;
      timeoutMock = sinon.spy(function(callback, delay) {
        if (delay === GRACE_DELAY - HTTP_LAG_UPPER_BOUND) {
          $httpBackend.expectDELETE('/graceperiod/api/tasks/' + id).respond(404, 'test');
          promiseBeforeEndOfGraceperiod = $q.when(callback());
          return promiseBeforeEndOfGraceperiod;
        }
      });

      gracePeriodService.grace({id: id});

      gracePeriodService.cancel(id).finally(function() {
        expect(httpSpy).to.have.been.calledWith(sinon.match.has('timeout', promiseBeforeEndOfGraceperiod));
        done();
      });

      $httpBackend.expectDELETE('/graceperiod/api/tasks/' + id).respond(200);
      $rootScope.$apply();
      $httpBackend.flush();
    });
  });

  describe('The grace fn', function() {
    var oldApplyAsync;

    this.timeout(10000);
    beforeEach(function() {
      oldApplyAsync = $rootScope.$applyAsync;
      $rootScope.$applyAsync = $rootScope.$apply;
    });

    afterEach(function() {
      $rootScope.$applyAsync = oldApplyAsync;
      angular.element('[data-notify="container"]').remove();
    });

    it('should register listener for the given id', function() {
      gracePeriodService.grace({id: id});
      expect(gracePeriodLiveNotificationServiceMock.registerListeners).to.have.been.calledWith(id);
    });

    it('should not resolve the promise when the delay elapses if the task did not success yet', function() {
      var spy = sinon.spy();

      gracePeriodService.grace({id: 'Test'}).then(spy);
      $rootScope.$digest();
      expect(spy).to.not.have.been.called;
    });

    it('should resolve the promise when the task success if not cancel has been asked', function() {
      var spy = sinon.spy();

      gracePeriodService.grace({id: 'Test'}).then(spy);
      taskDeferred.resolve();
      $rootScope.$digest();
      expect(spy).to.have.been.calledWith({cancelled: false});
    });

    it('should resolve the promise when the task success if cancel has been asked but has not responded yet', function() {
      var spy = sinon.spy();
      $httpBackend.expect('DELETE', '/graceperiod/api/tasks/' + id).respond(200);
      gracePeriodService.grace({id: id}).then(spy);
      notificationCancelCallback();
      taskDeferred.resolve();
      $rootScope.$digest();
      expect(spy).to.have.been.calledWith({cancelled: true, cancelFailed: true});
    });

    it('should resolve the promise when the task success if cancel has been asked and the cancel failed', function() {
      var spy = sinon.spy();

      initTimeout();

      $httpBackend.expect('DELETE', '/graceperiod/api/tasks/' + id).respond(500);
      gracePeriodService.grace({id: id}).then(spy);
      notificationCancelCallback();
      taskDeferred.resolve();
      $httpBackend.flush();
      $rootScope.$digest();
      expect(spy).to.have.been.calledWith({cancelFailed: true, cancelled: true});
    });

    it('should resolve if cancel has been asked and the cancel failed', function() {
      var spy = sinon.spy();

      initTimeout();

      $httpBackend.expect('DELETE', '/graceperiod/api/tasks/' + id).respond(500);
      gracePeriodService.grace({id: id}).then(spy);
      notificationCancelCallback();
      $httpBackend.flush();
      $rootScope.$digest();
      expect(spy).to.have.been.called;
    });

    it('should make the promise fail if cancel has been asked and worked', function() {
      var spy = sinon.spy();

      $httpBackend.expect('DELETE', '/graceperiod/api/tasks/' + id).respond(200);
      gracePeriodService.grace({id: id}).catch(spy);
      notificationCancelCallback();
      $httpBackend.flush();
      $rootScope.$digest();
      expect(spy).to.have.been.calledOnce;

      //expect(spy).to.have.been.calledWith({cancelled: true, cancelFailed: false});
    });

    it('should make the promise fail if the task fail', function() {
      var spy = sinon.spy();

      gracePeriodService.grace({id: id}).catch(spy);
      taskDeferred.reject();
      $rootScope.$digest();
      expect(spy).to.have.been.calledWith({cancelled: false});
    });

    it('should make the promise fail if cancel tentative fail but the task fail meanwhile', function() {
      var spy = sinon.spy();

      initTimeout();

      $httpBackend.expect('DELETE', '/graceperiod/api/tasks/' + id).respond(500);
      gracePeriodService.grace({id: id}).catch(spy);

      notificationCancelCallback();

      taskDeferred.reject();
      $rootScope.$digest();

      $rootScope.$digest();
      expect(spy).to.have.been.calledWith({cancelled: true, cancelFailed: false});
    });
  });

  describe('The getTasksFor fn', function() {

    var taskId = 'taskId';
    var context = {
      id: 'anId',
      p: 'anotherProperty'
    };

    this.timeout(10000);
    beforeEach(function() {
      $rootScope.$applyAsync = $rootScope.$apply;
    });

    beforeEach(function() {
      gracePeriodService.grace({id: taskId, context: context});
    });

    it('should return an empty array if no context query is passed as parameter', function() {
      expect(gracePeriodService.getTasksFor()).to.deep.equal([]);
    });

    it('should return an empty array if no task exists for this context query', function() {
      expect(gracePeriodService.getTasksFor({id: 'anotherId'})).to.deep.equal([]);
      expect(gracePeriodService.getTasksFor({id: 'anId', p: 'anotherProperty', p2: 'yolo'})).to.deep.equal([]);
    });

    it('should return the tasks matching this context query', function() {
      expect(gracePeriodService.getTasksFor(context)).to.deep.equal([taskId]);
      expect(gracePeriodService.getTasksFor({id: context.id})).to.deep.equal([taskId]);
      expect(gracePeriodService.getTasksFor({p: context.p})).to.deep.equal([taskId]);
    });
  });

  describe('The hasTask fn', function() {

    var taskId = 'taskId';

    beforeEach(function() {
      gracePeriodService.grace({id: taskId});
    });

    it('should return false if no id is given', function() {
      expect(gracePeriodService.hasTask()).to.be.false;
    });

    it('should return false if no task exist for the given id', function() {
      expect(gracePeriodService.hasTask('anotherId')).to.be.false;
    });

    it('should return true if a task exist for the given id', function() {
      expect(gracePeriodService.hasTask(taskId)).to.be.true;
    });
  });
});
