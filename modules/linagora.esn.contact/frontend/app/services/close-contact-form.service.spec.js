'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The closeContactForm service', function() {

  beforeEach(function() {
    module('linagora.esn.contact');
  });

  beforeEach(function() {
    var self = this;
    self.state = {};

    angular.mock.module(function($provide) {
      $provide.value('$state', self.state);
    });
  });

  beforeEach(angular.mock.inject(function(closeContactForm) {
    this.closeContactForm = closeContactForm;
  }));

  it('should change path to /contact', function() {
    this.state.go = sinon.spy();
    this.closeContactForm();
    expect(this.state.go).to.have.been.calledWith('contact');
  });
});
