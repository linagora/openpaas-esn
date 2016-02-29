'use strict';

/* global chai: false */

var expect = chai.expect;

describe('Calendar constants', function() {

  beforeEach(function() {
    var self = this;
    angular.mock.module('esn.calendar');
    angular.mock.inject(function(UI_CONFIG) {
      self.UI_CONFIG = UI_CONFIG;
    });
  });

  it('mini-calendar should not be editable', function() {
    expect(this.UI_CONFIG.miniCalendar.editable).to.be.false;
  });
});
