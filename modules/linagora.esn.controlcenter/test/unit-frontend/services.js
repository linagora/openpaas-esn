'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The linagora.esn.controlcenter Angular module services', function() {

  beforeEach(function() {
    module('linagora.esn.controlcenter');
  });

  describe('The controlCenterMenuTemplateBuilder service', function() {

    var controlCenterMenuTemplateBuilder;

    beforeEach(inject(function(_controlCenterMenuTemplateBuilder_) {
      controlCenterMenuTemplateBuilder = _controlCenterMenuTemplateBuilder_;
    }));

    it('should build the menu template with href', function() {
      var expectedOutput = '<controlcenter-sidebar-menu-item icon="myIcon" href="/myHref" label="myLabel" />';

      expect(controlCenterMenuTemplateBuilder('/myHref', 'myIcon', 'myLabel'))
        .to.equal(expectedOutput);
    });

    it('should build the menu template with ui-sref as a child of controlcenter state', function() {
      var expectedOutput = '<controlcenter-sidebar-menu-item icon="myIcon" label="myLabel" ui-sref="controlcenter.child" ui-sref-active="selected" />';

      expect(controlCenterMenuTemplateBuilder('controlcenter.child', 'myIcon', 'myLabel'))
        .to.equal(expectedOutput);
    });

  });

});
