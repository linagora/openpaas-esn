'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The GracePeriod Angular module', function() {

  describe('The gracePeriodLiveNotification service', function() {

    beforeEach(function() {
      module('esn.websocket');
      module('linagora.esn.graceperiod');
    });

    describe('Functions tests', function() {

      var gracePeriodLiveNotification, $rootScope;
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

        inject(function(_$rootScope_, _gracePeriodLiveNotification_) {
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

    var gracePeriodService, put, remove, gracePeriodAPI, $rootScope, $browser, $timeout, $q;

    beforeEach(function() {
      module('esn.websocket');

      gracePeriodAPI = {
        one: function() {
          return {
            one: function() {
              return {
                put: put,
                remove: remove
              };
            }
          };
        }
      };

      module('linagora.esn.graceperiod', function($provide) {
        $provide.value('gracePeriodAPI', gracePeriodAPI);
      });
    });

    beforeEach(angular.mock.inject(function(_gracePeriodService_, _$rootScope_, _$browser_, _$timeout_, _$q_) {
      $rootScope = _$rootScope_;
      gracePeriodService = _gracePeriodService_;
      $browser = _$browser_;
      $timeout = _$timeout_;
      $q = _$q_;
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

      it('should not call PUT when id does exists', function(done) {
        var id = '123';
        put = sinon.spy();
        gracePeriodService.flush(id).then(function() {
          expect(put.called).to.be.false;
          done();
        }, done);

        $rootScope.$apply();
      });

      it('should call PUT when id exists', function(done) {
        var id = '123';
        gracePeriodService.addTaskId(id);

        put = sinon.spy();
        gracePeriodService.flush(id).then(function() {
          expect(put.called).to.be.true;
          done();
        }, done);
        $rootScope.$apply();
      });

    });

    describe('The cancel fn', function() {

      it('should not call DELETE when task does not exists', function(done) {
        var id = '123';
        remove = sinon.spy();
        gracePeriodService.cancel(id).then(function() {
          expect(remove.called).to.be.false;
          done();
        }, done);

        $rootScope.$apply();
      });

      it('should call DELETE when task exists', function(done) {
        var id = '123';
        gracePeriodService.addTaskId(id);
        remove = sinon.spy();
        gracePeriodService.cancel(id).then(function() {
          expect(remove.called).to.be.true;
          done();
        }, done);

        $rootScope.$apply();
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
        gracePeriodService.grace('Test', 'Cancel', 100).then(function(data) {
          if (!data.cancelled) {
            done();
          }
        });
      });

      it('should resolve the promise when the close button is clicked', function(done) {
        gracePeriodService.grace('Test', 'Cancel', 10000).then(function(data) {
          if (!data.cancelled) {
            done();
          }
        });

        angular.element('[data-notify="dismiss"]').click();
      });

      it('should reject the promise when the cancel link is clicked', function(done) {
        gracePeriodService.grace('Test', 'Cancel', 10000).then(function(data) {
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
  });

});
