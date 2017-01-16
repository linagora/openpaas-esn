'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The request utility functions', function() {

  var $rootScope;

  function expectRejection(promise, done) {
    promise.catch(function() {
      done();
    });

    $rootScope.$digest();
  }

  function expectResolve(promise, expected, done) {
    promise.then(function(value) {
      expect(value).to.deep.equal(expected);

      done();
    });

    $rootScope.$digest();
  }

  beforeEach(function() {
    module('esn.calendar');
  });

  describe('The gracePeriodResponseHandler factory', function() {

    var gracePeriodResponseHandler;

    beforeEach(function() {
      inject(function(_$rootScope_, _gracePeriodResponseHandler_) {
        $rootScope = _$rootScope_;
        gracePeriodResponseHandler = _gracePeriodResponseHandler_;
      });
    });

    it('should reject if the status code is not 202, even if it is a success status code', function(done) {
      expectRejection(gracePeriodResponseHandler({ status: 200 }), done);
    });

    it('should resolve with response.data.id', function(done) {
      expectResolve(gracePeriodResponseHandler({ status: 202, data: { id: 'myTaskId' } }), 'myTaskId', done);
    });

  });

});
