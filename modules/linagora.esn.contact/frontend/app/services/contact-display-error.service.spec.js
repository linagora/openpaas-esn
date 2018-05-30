'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The contactDisplayError service', function() {

  var alertMock;

  beforeEach(function() {
    module('linagora.esn.contact');
  });

  beforeEach(function() {
    var self = this;

    self.$alert = function(args) {
      return alertMock(args);
    };

    angular.mock.module(function($provide) {
      $provide.value('$alert', self.$alert);
    });
  });

  beforeEach(angular.mock.inject(function(contactDisplayError) {
    this.contactDisplayError = contactDisplayError;
  }));

  it('should call the $alert service', function() {
    alertMock = sinon.spy();
    var err = 'This is the error';

    this.contactDisplayError(err);
    expect(alertMock).to.have.been.calledWith({
      content: err,
      type: 'danger',
      show: true,
      position: 'bottom',
      container: '.contact-error-container',
      duration: '3',
      animation: 'am-flip-x'
    });
  });
});
