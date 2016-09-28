'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The GracePeriod Angular module', function() {

  describe('The gracePeriodLiveNotification service', function() {

    beforeEach(function() {
      module('esn.websocket');
      module('esn.http');
      module('linagora.esn.graceperiod');
    });

    describe('Functions tests', function() {

      var gracePeriodLiveNotification, $rootScope, $q;
      var liveNotificationMock, onFn, removeListenerFn;

      beforeEach(function() {
        onFn = sinon.spy();
        removeListenerFn = sinon.spy();
        liveNotificationMock = sinon.stub().returns({
          on: onFn,
          removeListener: removeListenerFn
        });

        module(function($provide) {
          $provide.value('livenotification', liveNotificationMock);
        });

        inject(function(_$rootScope_, _gracePeriodLiveNotification_, _$q_) {
          $q = _$q_;
          $rootScope = _$rootScope_;
          gracePeriodLiveNotification = _gracePeriodLiveNotification_;
        });
      });

      describe('The start function', function() {
        it('should register listener once', function() {
          gracePeriodLiveNotification.start();
          gracePeriodLiveNotification.start();
          expect(onFn.callCount).to.equal(2);
        });

        it('should register listeners for error and done events', function() {
          gracePeriodLiveNotification.start();
          expect(onFn.firstCall.calledWith('graceperiod:error')).to.be.true;
          expect(onFn.secondCall.calledWith('graceperiod:done')).to.be.true;
        });
      });

      describe('The stop function', function() {
        it('should do nothing when not started', function() {
          gracePeriodLiveNotification.stop();
          expect(removeListenerFn.called).to.be.false;
        });

        it('should remove listeners for error and done', function() {
          gracePeriodLiveNotification.start();
          gracePeriodLiveNotification.stop();
          expect(removeListenerFn.firstCall.calledWith('graceperiod:error')).to.be.true;
          expect(removeListenerFn.secondCall.calledWith('graceperiod:done')).to.be.true;
        });
      });

      describe('The registerListeners function', function() {
        it('should return when task is null', function() {
          gracePeriodLiveNotification.registerListeners();
          expect(gracePeriodLiveNotification.getListeners()).to.be.empty;
        });

        it('should save listeners', function() {
          gracePeriodLiveNotification.registerListeners('foo');
          expect(gracePeriodLiveNotification.getListeners().foo).to.exist;
        });

        it('should save listeners as many times as called', function() {
          gracePeriodLiveNotification.registerListeners('foo');
          gracePeriodLiveNotification.registerListeners('foo');
          gracePeriodLiveNotification.registerListeners('bar');
          expect(gracePeriodLiveNotification.getListeners().foo.length).to.equal(2);
          expect(gracePeriodLiveNotification.getListeners().bar.length).to.equal(1);
        });

      });

      describe('The unregisterListeners function', function() {
        it('should return when task is null', function() {
          gracePeriodLiveNotification.registerListeners('foo');
          gracePeriodLiveNotification.unregisterListeners();
          expect(gracePeriodLiveNotification.getListeners().foo.length).to.equal(1);
        });

        it('should remove listeners for given task', function() {
          gracePeriodLiveNotification.registerListeners('foo');
          gracePeriodLiveNotification.unregisterListeners('foo');
          expect(gracePeriodLiveNotification.getListeners().foo).to.not.exist;
        });
      });
    });

    describe('Events tests', function() {

      var gracePeriodLiveNotification, $rootScope;
      var liveNotificationMock;
      var called;

      function promiseMe(id) {
        return function(data) {
          var defer = $q.defer();
          defer.resolve(data);
          called.push(id);
          return defer.promise;
        };
      }

      beforeEach(function() {
        called = [];

        var events = {};

        var handler = function(event, data) {
          if (!events[event]) {
            return;
          }

          events[event].forEach(function(listener) {
            listener(data);
          });

        };

        liveNotificationMock = function() {
          return {
            emit: handler,
            on: function(event, callback) {
              if (!events[event]) {
                events[event] = [];
              }
              events[event].push(callback);
            }
          };
        };

        module(function($provide) {
          $provide.value('livenotification', liveNotificationMock);
        });

        inject(function(_$rootScope_, _gracePeriodLiveNotification_) {
          $rootScope = _$rootScope_;
          gracePeriodLiveNotification = _gracePeriodLiveNotification_;
        });
      });

      describe('When started', function() {

        describe('on error event', function() {
          it('should run all the registered error listeners', function() {

            var sio = gracePeriodLiveNotification.start();

            var id = 'foo';
            gracePeriodLiveNotification.registerListeners(id, promiseMe('1'), promiseMe('4'));
            gracePeriodLiveNotification.registerListeners(id, promiseMe('2'));
            gracePeriodLiveNotification.registerListeners('bar', promiseMe('3'));

            $rootScope.$digest();
            sio.emit('graceperiod:error', {id: id});
            $rootScope.$digest();

            expect(called.length).to.equal(2);
            expect(called).to.not.contain('3');
            expect(called).to.not.contain('4');
          });

          it('should run all the registered error listeners once', function() {

            var sio = gracePeriodLiveNotification.start();

            var id = 'foo';
            gracePeriodLiveNotification.registerListeners(id, promiseMe('1'));
            gracePeriodLiveNotification.registerListeners(id, promiseMe('2'));

            $rootScope.$digest();
            sio.emit('graceperiod:error', {id: id});
            $rootScope.$digest();
            sio.emit('graceperiod:error', {id: id});
            $rootScope.$digest();
            expect(called.length).to.equal(2);
          });

        });

        describe('on done event', function() {
          it('should run all the registered done listeners', function() {
            var sio = gracePeriodLiveNotification.start();

            var id = 'foo';
            gracePeriodLiveNotification.registerListeners(id, promiseMe('1'), promiseMe('4'));
            gracePeriodLiveNotification.registerListeners(id, promiseMe('2'));
            gracePeriodLiveNotification.registerListeners('bar', promiseMe('3'));

            $rootScope.$digest();
            sio.emit('graceperiod:done', {id: id});
            $rootScope.$digest();

            expect(called.length).to.equal(1);
            expect(called).to.contain('4');
          });

          it('should run all the registered done listeners once', function() {
            var sio = gracePeriodLiveNotification.start();

            var id = 'foo';
            gracePeriodLiveNotification.registerListeners(id, null, promiseMe('1'));
            gracePeriodLiveNotification.registerListeners(id, null, promiseMe('2'));

            $rootScope.$digest();
            sio.emit('graceperiod:done', {id: id});
            $rootScope.$digest();
            sio.emit('graceperiod:done', {id: id});
            $rootScope.$digest();
            expect(called.length).to.equal(2);
          });
        });
      });
    });
  });

  describe('The gracePeriodService service', function() {

    var gracePeriodService, $httpBackend, $rootScope, $browser, $timeout;
    var timeoutMock, GRACE_DELAY, HTTP_LAG_UPPER_BOUND;
    var httpSpy;

    beforeEach(function() {
      module('esn.websocket');
      module('linagora.esn.graceperiod');

      timeoutMock = null;
      module(function($provide) {
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

    beforeEach(angular.mock.inject(function(_gracePeriodService_, _$rootScope_, _$browser_, _$timeout_, _$httpBackend_, _GRACE_DELAY_, _HTTP_LAG_UPPER_BOUND_) {
      $rootScope = _$rootScope_;
      gracePeriodService = _gracePeriodService_;
      $browser = _$browser_;
      $timeout = _$timeout_;
      $httpBackend = _$httpBackend_;
      GRACE_DELAY = _GRACE_DELAY_;
      HTTP_LAG_UPPER_BOUND = _HTTP_LAG_UPPER_BOUND_;
    }));

    describe('The remove fn', function() {

      it('should reject when id is not in list', function(done) {
        gracePeriodService.remove('123').then(function() {
          done(new Error());
        }, function() {
          done();
        });

        $rootScope.$apply();
      });

      it('should resolve when id is in the list', function(done) {
        var id = '123';
        gracePeriodService.addTaskId(id);
        gracePeriodService.remove(id).then(done, done);
        $rootScope.$apply();
      });

    });

    describe('The flush fn', function() {

      it('should not call PUT and reject when id does exists', function(done) {
        var id = '123';
        gracePeriodService.flush(id).then(null, function() { done(); });
        $rootScope.$apply();
        $httpBackend.flush();
      });

      it('should call PUT when id exists', function(done) {
        var id = '123';
        gracePeriodService.addTaskId(id);

        gracePeriodService.flush(id).then(function() {
          done();
        }, done);
        $httpBackend.expectPUT('/graceperiod/api/tasks/' + id).respond({});
        $rootScope.$apply();
        $httpBackend.flush();
      });

    });

    describe('The cancel fn', function() {

      it('should not call DELETE and reject when task does not exists', function(done) {
        var id = '123';
        gracePeriodService.cancel(id).then(null, function() { done(); });
        $rootScope.$apply();
        $httpBackend.flush();
      });

      it('should call DELETE when task exists', function(done) {
        var id = '123';
        gracePeriodService.addTaskId(id);
        gracePeriodService.cancel(id).then(function() {
          done();
        }, done);
        $httpBackend.expectDELETE('/graceperiod/api/tasks/' + id).respond({});
        $rootScope.$apply();
        $httpBackend.flush();
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

        gracePeriodService.addTaskId(id);

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

        gracePeriodService.addTaskId(id);

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

        gracePeriodService.addTaskId(id);

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

        gracePeriodService.addTaskId(id);

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

      it('should resolve the promise when the delay elapses', function(done) {
        gracePeriodService.grace('Test', 'Cancel', 'text', 100).then(function(data) {
          if (!data.cancelled) {
            done();
          }
        });
      });

      it('should resolve the promise when the close button is clicked', function(done) {
        gracePeriodService.grace('Test', 'Cancel', 'text', 10000).then(function(data) {
          if (!data.cancelled) {
            done();
          }
        });

        angular.element('[data-notify="dismiss"]').click();
      });

      it('should reject the promise when the cancel link is clicked', function(done) {
        gracePeriodService.grace('Test', 'Cancel', 'text', 10000).then(function(data) {
          if (data.cancelled) {
            done();
          }
        });

        angular.element('a.cancel-task').click();
      });

      it('should add a cancel link to the notification', function() {
        gracePeriodService.grace('Test', 'Cancel');

        expect(angular.element('a.cancel-task').length).to.equal(1);
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
        gracePeriodService.addTaskId(taskId, context);
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
        gracePeriodService.addTaskId(taskId);
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

    describe('The flushTasksFor fn', function() {

      var taskId1 = 'taskId1';
      var taskId2 = 'taskId2';
      var context = {
        id: 'anId',
        p: 'anotherProperty'
      };

      beforeEach(function() {
        gracePeriodService.addTaskId(taskId1, context);
        gracePeriodService.addTaskId(taskId2, context);
      });

      it('should return a promise resolving to an empty array when no context is given', function(done) {
        gracePeriodService.flushTasksFor().then(function(response) {
          expect(response).to.deep.equal([]);
          done();
        });
        $rootScope.$apply();
      });

      it('should return a promise resolving to an empty array if no task matches the context', function(done) {
        gracePeriodService.flushTasksFor({id: 'aRandomId'}).then(function(response) {
          expect(response).to.deep.equal([]);
          done();
        });
        $rootScope.$apply();
      });

      it('should return a promise resolved when all tasks matching the context have been flushed', function(done) {
        $httpBackend.expectPUT('/graceperiod/api/tasks/' + taskId1).respond({});
        $httpBackend.expectPUT('/graceperiod/api/tasks/' + taskId2).respond({});
        gracePeriodService.flushTasksFor(context).then(function() {
          done();
        }, done);
        $rootScope.$apply();
        $httpBackend.flush();
      });
    });
  });

});
