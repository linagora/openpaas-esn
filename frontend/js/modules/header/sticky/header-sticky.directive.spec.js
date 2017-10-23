'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esnHeaderSticky directive', function() {
  var $rootScope, $compile;
  var scope;

  beforeEach(function() {
    module('jadeTemplates');
    module('esn.header');
  });

  beforeEach(inject(function(
    _$rootScope_,
    _$compile_
  ) {
    $rootScope = _$rootScope_;
    $compile = _$compile_;
  }));

  function initDirective(html) {
    scope = $rootScope.$new();

    var element = $compile(html || '<div esn-header-sticky></div>')(scope);

    scope.$digest();

    return element;
  }

  it('should add sticky directive to element', function() {
    var element = initDirective();

    expect(element.attr('hl-sticky')).to.exist;
    expect(element.attr('offset-top')).to.exist;
  });

});
