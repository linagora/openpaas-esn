'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The esnLoginSuccessService factory', function() {
  var esnLoginSuccessService, $window;

  beforeEach(function() {
    module('esn.login');
  });

  beforeEach(inject(function(_$window_, _esnLoginSuccessService_) {
    $window = _$window_;
    esnLoginSuccessService = _esnLoginSuccessService_;
  }));

  it('should return a  function', function() {
    expect(esnLoginSuccessService).to.be.a('function');
  });

  it('should reload the page when fired', function() {
    $window.location.reload = sinon.spy();
    esnLoginSuccessService();

    expect($window.location.reload).to.have.been.calledOnce;
  });

  it('should return a promise', function() {
    $window.location.reload = sinon.spy();
    var loginResponse = esnLoginSuccessService();

    expect(loginResponse).to.respondTo('then');
  });
});
