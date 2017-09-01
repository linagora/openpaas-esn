'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The controlCenterMenuTemplateBuilder service', function() {

  var controlCenterMenuTemplateBuilder, featureFlags;

  beforeEach(function() {
    module('linagora.esn.controlcenter');

    inject(function(_featureFlags_) {
      featureFlags = _featureFlags_;
    });
  });

  beforeEach(inject(function(_controlCenterMenuTemplateBuilder_) {
    controlCenterMenuTemplateBuilder = _controlCenterMenuTemplateBuilder_;
  }));

  it('should not build the menu if flag is turnned off', function() {
    featureFlags.isOn = function() {
      return false;
    };

    expect(controlCenterMenuTemplateBuilder('/myHref', 'myIcon', 'myLabel', 'myFlag')).to.equal('');
  });

  it('should build the menu if flag is turned on', function() {
    featureFlags.isOn = function() {
      return true;
    };

    var expectedOutput = '<controlcenter-sidebar-menu-item icon="myIcon" href="/myHref" label="myLabel" />';

    expect(controlCenterMenuTemplateBuilder('/myHref', 'myIcon', 'myLabel', 'myFlag')).to.equal(expectedOutput);
  });

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
