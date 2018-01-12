'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The esnPromiseService factory', function() {
  var $timeout, esnPromiseService, ESN_PROMISE_RETRY_DEFAULT_OPTIONS;

  beforeEach(angular.mock.module('esn.promise'));
  beforeEach(inject(function(_$timeout_, _esnPromiseService_, _ESN_PROMISE_RETRY_DEFAULT_OPTIONS_) {
    $timeout = _$timeout_;
    esnPromiseService = _esnPromiseService_;
    ESN_PROMISE_RETRY_DEFAULT_OPTIONS = _ESN_PROMISE_RETRY_DEFAULT_OPTIONS_;
  }));

  describe('The retry function', function() {
    function flushTimeout(maxRetry) {
      maxRetry = maxRetry || ESN_PROMISE_RETRY_DEFAULT_OPTIONS.maxRetry;
      // $timeout.flush() required for each retry attempt
      for (var i = 0; i < maxRetry; i++) {
        $timeout.flush();
      }
    }

    it('should eventually succeed when a promise has failed once', function(done) {
      var attempts = 0,
        promiseFailingOnce = function() { return attempts++ < 1 ? $q.reject('I\'ve failed once') : $q.when({}); },
        retryOnlyOncePolicy = { maxRetry: 2 };

      esnPromiseService.retry(promiseFailingOnce, retryOnlyOncePolicy)
        .then(function(result) {
          expect(result).to.deep.equal({});
          done();
        });

      flushTimeout(retryOnlyOncePolicy.maxRetry);
    });

    it('should eventually fail after a few attempts', function(done) {
      var failureMessage = 'failing doing what i was hired to do',
        alwaysFailingMock = function() { return $q.reject(new Error(failureMessage)); },
        MAX_RETRY = 4;

      esnPromiseService.retry(alwaysFailingMock, { maxRetry: MAX_RETRY })
        .catch(function(err) {
          expect(err.message).to.equal(failureMessage);
          done();
        });

      flushTimeout(MAX_RETRY);
    });

    it('should immediately resolve with successful promises', function(done) {
      var successfulPromiseMock = sinon.spy(function() { return $q.when({ success: true }); });

      esnPromiseService.retry(successfulPromiseMock)
        .then(function(result) {
          expect(result).to.deep.equal({ success: true });
          expect(successfulPromiseMock).to.have.been.calledOnce;
          done();
        });

      flushTimeout(1);
    });

    it('should override default maximum retry attempts if missing', function(done) {
      esnPromiseService.retry(function() { return $q.reject(); }, { interval: 1234 })
        .catch(function() {
          done();
        });

      flushTimeout();
    });
  });
});
