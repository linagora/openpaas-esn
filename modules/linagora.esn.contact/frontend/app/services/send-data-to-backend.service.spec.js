'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The sendContactToBackend service', function() {
  var $rootScope, sendContactToBackend;
  var sendRequestFn;

  beforeEach(function() {
    module('linagora.esn.contact');

    inject(function(_$rootScope_, _sendContactToBackend_) {
      $rootScope = _$rootScope_;
      sendContactToBackend = _sendContactToBackend_;
    });

    sendRequestFn = angular.noop;
  });

  it('should reject if calling is already set to true', function(done) {
    sendContactToBackend({ calling: true }, sendRequestFn)
      .then(function() {
        done('should not resolve');
      })
      .catch(function(err) {
        expect(err).to.equal('The form is already being submitted');
        done();
      });

    $rootScope.$digest();
  });

  it('should set calling to true while sending the request', function() {
    var scope = { calling: false };

    sendRequestFn = function() {
      return $q.when();
    };

    sendContactToBackend(scope, sendRequestFn);

    expect(scope.calling).to.be.true;

    $rootScope.$digest();
  });

  it('should reject if request fails', function(done) {
    var scope = { calling: false };

    sendRequestFn = sinon.stub().returns($q.reject('something wrong'));

    sendContactToBackend(scope, sendRequestFn)
      .then(function() {
        done('should not resolve');
      })
      .catch(function(err) {
        expect(err).to.equal('something wrong');
        expect(sendRequestFn).to.have.been.calledOnce;
        expect(scope.calling).to.be.false;
        done();
      });

    $rootScope.$digest();
  });

  it('should resolve if request success', function(done) {
    var scope = { calling: false };

    sendRequestFn = sinon.stub().returns($q.resolve());

    sendContactToBackend(scope, sendRequestFn)
      .then(function() {
        expect(sendRequestFn).to.have.been.calledOnce;
        expect(scope.calling).to.be.false;
        done();
      })
      .catch(function(err) {
        done(err || 'should resolve');
      });

    $rootScope.$digest();
  });
});
