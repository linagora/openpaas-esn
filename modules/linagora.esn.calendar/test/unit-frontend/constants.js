'use strict';

/* global chai: false */

var expect = chai.expect;

describe('Calendar constants', function() {

  beforeEach(function() {
    var self = this;
    angular.mock.module('esn.calendar');
    angular.mock.inject(function(USER_UI_CONFIG) {
      self.USER_UI_CONFIG = USER_UI_CONFIG;
    });
  });

  it('mini-calendar should not be editable', function() {
    expect(this.USER_UI_CONFIG.miniCalendar.editable).to.be.false;
  });
});
