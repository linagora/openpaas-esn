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

  describe('The calHttpResponseHandler factory', function() {

    var calHttpResponseHandler;

    beforeEach(function() {
      inject(function(_$rootScope_, _responseHandler_) {
        $rootScope = _$rootScope_;
        calHttpResponseHandler = _responseHandler_;
      });
    });

    it('should reject if the status code is invalid', function(done) {
      expectRejection(calHttpResponseHandler(200)({ status: 400 }), done);
    });

    it('should reject if the status code is not in the given success codes array', function(done) {
      expectRejection(calHttpResponseHandler([200, 201, 202])({ status: 400 }), done);
    });

    it('should resolve with the response if there is no custom handler', function(done) {
      var response = { status: 200 };

      expectResolve(calHttpResponseHandler(200)(response), response, done);
    });

    it('should pass the resolved response to the custom handler if there is one', function(done) {
      var data = { a: 'b' },
          response = { status: 200, data: data };

      expectResolve(calHttpResponseHandler(200, function(response) {
        return response.data;
      })(response), data, done);
    });

  });

});
